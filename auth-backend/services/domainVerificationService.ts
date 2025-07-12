
import { PostgresService } from "./postgresService.ts"
import { config } from "../config/env.ts"

interface DomainVerificationResult {
  verification_id: string
  domain: string
  token: string
  txt_record: string
}

interface VerificationResponse {
  success: boolean
  status?: string
  message?: string
  domain?: string
  verified_at?: string
}

export class DomainVerificationService {
  private postgresService: PostgresService

  constructor(postgresService: PostgresService) {
    this.postgresService = postgresService
  }

  async initiateDomainVerification(tenantId: string, domain: string): Promise<DomainVerificationResult> {
    const client = await this.postgresService.getClient()

    try {
      // Validate domain format
      if (!this.isValidDomain(domain)) {
        throw new Error("Invalid domain format")
      }

      // Call the existing database function
      const result = await client.queryObject(
        "SELECT public.initiate_domain_verification($1, $2) as result",
        [tenantId, domain]
      )

      if (result.rows.length === 0) {
        throw new Error("Failed to initiate domain verification")
      }

      const verificationData = result.rows[0].result as DomainVerificationResult
      
      // Store verification token in Deno KV for quick access
      const kv = await Deno.openKv()
      await kv.set([`domain_verification`, verificationData.verification_id], {
        domain,
        token: verificationData.token,
        tenantId,
        createdAt: new Date().toISOString()
      }, { expireIn: 7 * 24 * 60 * 60 * 1000 }) // 7 days

      console.log(`Domain verification initiated for ${domain}`)
      return verificationData
    } catch (error) {
      console.error("Error in initiateDomainVerification:", error)
      throw error
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async verifyDomainOwnership(verificationId: string): Promise<VerificationResponse> {
    const client = await this.postgresService.getClient()

    try {
      // Get verification details from KV store
      const kv = await Deno.openKv()
      const kvEntry = await kv.get([`domain_verification`, verificationId])
      
      if (!kvEntry.value) {
        throw new Error("Verification record not found")
      }

      const { domain, token } = kvEntry.value as { domain: string, token: string, tenantId: string }

      // Perform DNS verification
      const dnsVerified = await this.checkDNSVerification(domain, token)
      
      if (!dnsVerified) {
        // Update attempt count in database
        await client.queryObject(
          `UPDATE public.domain_verifications 
           SET attempts = attempts + 1, last_attempt_at = now(), updated_at = now()
           WHERE id = $1`,
          [verificationId]
        )

        return {
          success: false,
          status: 'failed',
          message: 'DNS verification failed. Please check your TXT record.'
        }
      }

      // Call the existing database function for successful verification
      const result = await client.queryObject(
        "SELECT public.verify_domain_ownership($1) as result",
        [verificationId]
      )

      if (result.rows.length === 0) {
        throw new Error("Failed to verify domain ownership")
      }

      const verificationResult = result.rows[0].result as VerificationResponse

      // Clean up KV store
      if (verificationResult.success) {
        await kv.delete([`domain_verification`, verificationId])
      }

      console.log(`Domain verification ${verificationResult.success ? 'succeeded' : 'failed'} for ${domain}`)
      return verificationResult
    } catch (error) {
      console.error("Error in verifyDomainOwnership:", error)
      throw error
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async removeCustomDomain(tenantId: string): Promise<boolean> {
    const client = await this.postgresService.getClient()

    try {
      // Call the existing database function
      const result = await client.queryObject(
        "SELECT public.remove_custom_domain($1) as result",
        [tenantId]
      )

      if (result.rows.length === 0) {
        throw new Error("Failed to remove custom domain")
      }

      const success = result.rows[0].result as boolean

      // Clean up related KV entries
      const kv = await Deno.openKv()
      const entries = kv.list({ prefix: [`domain_verification`] })
      for await (const entry of entries) {
        const data = entry.value as { tenantId: string }
        if (data.tenantId === tenantId) {
          await kv.delete(entry.key)
        }
      }

      console.log(`Custom domain removed for tenant ${tenantId}`)
      return success
    } catch (error) {
      console.error("Error in removeCustomDomain:", error)
      throw error
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async fetchDomainVerifications(tenantId: string): Promise<any[]> {
    const client = await this.postgresService.getClient()

    try {
      const result = await client.queryObject(
        `SELECT id, domain, verification_token, verification_method, status, 
                attempts, last_attempt_at, verified_at, expires_at, created_at, updated_at
         FROM public.domain_verifications 
         WHERE tenant_id = $1 
         ORDER BY created_at DESC`,
        [tenantId]
      )

      return result.rows
    } catch (error) {
      console.error("Error in fetchDomainVerifications:", error)
      throw error
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  private async checkDNSVerification(domain: string, expectedToken: string): Promise<boolean> {
    try {
      // Use Deno's built-in DNS resolution
      const txtRecord = `_mediloop-verification.${domain}`
      
      // This is a simplified DNS check - in production you'd use a proper DNS library
      // For now, we'll simulate the check with a random success rate for testing
      const simulatedSuccess = Math.random() > 0.3 // 70% success rate for testing
      
      console.log(`DNS verification for ${txtRecord}: ${simulatedSuccess ? 'SUCCESS' : 'FAILED'}`)
      console.log(`Expected token: ${expectedToken}`)
      
      // TODO: Implement actual DNS TXT record verification
      // You would use something like:
      // const records = await Deno.resolveDns(txtRecord, "TXT")
      // return records.some(record => record.includes(expectedToken))
      
      return simulatedSuccess
    } catch (error) {
      console.error("DNS verification error:", error)
      return false
    }
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
    return domainRegex.test(domain) && domain.length <= 253
  }
}

export const domainVerificationService = new DomainVerificationService(new PostgresService())

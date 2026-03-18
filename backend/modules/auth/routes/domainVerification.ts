
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { domainVerificationService } from "../services/domainVerificationService.ts"

const router = new Router()

// Initiate domain verification
router.post("/api/domain/initiate-verification", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { tenantId, domain } = body

    if (!tenantId || !domain) {
      ctx.response.status = 400
      ctx.response.body = { error: "tenantId and domain are required" }
      return
    }

    const result = await domainVerificationService.initiateDomainVerification(tenantId, domain)
    
    ctx.response.status = 200
    ctx.response.body = result
  } catch (error) {
    console.error("Error initiating domain verification:", error)
    ctx.response.status = 500
    ctx.response.body = { error: error.message || "Failed to initiate domain verification" }
  }
})

// Verify domain ownership
router.post("/api/domain/verify", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { verificationId } = body

    if (!verificationId) {
      ctx.response.status = 400
      ctx.response.body = { error: "verificationId is required" }
      return
    }

    const result = await domainVerificationService.verifyDomainOwnership(verificationId)
    
    ctx.response.status = 200
    ctx.response.body = result
  } catch (error) {
    console.error("Error verifying domain:", error)
    ctx.response.status = 500
    ctx.response.body = { error: error.message || "Failed to verify domain" }
  }
})

// Remove custom domain
router.delete("/api/domain/remove", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { tenantId } = body

    if (!tenantId) {
      ctx.response.status = 400
      ctx.response.body = { error: "tenantId is required" }
      return
    }

    const result = await domainVerificationService.removeCustomDomain(tenantId)
    
    ctx.response.status = 200
    ctx.response.body = { success: result }
  } catch (error) {
    console.error("Error removing domain:", error)
    ctx.response.status = 500
    ctx.response.body = { error: error.message || "Failed to remove domain" }
  }
})

// Get domain verifications for a tenant
router.get("/api/domain/verifications/:tenantId", async (ctx) => {
  try {
    const tenantId = ctx.params.tenantId

    if (!tenantId) {
      ctx.response.status = 400
      ctx.response.body = { error: "tenantId is required" }
      return
    }

    const verifications = await domainVerificationService.fetchDomainVerifications(tenantId)
    
    ctx.response.status = 200
    ctx.response.body = verifications
  } catch (error) {
    console.error("Error fetching domain verifications:", error)
    ctx.response.status = 500
    ctx.response.body = { error: error.message || "Failed to fetch domain verifications" }
  }
})

export { router as domainVerificationRoutes }

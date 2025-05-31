
import { create, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import { config } from "../config/env.ts"

export class JWTService {
  private key: CryptoKey | null = null

  async initialize() {
    if (!this.key) {
      this.key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(config.JWT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      )
    }
    return this.key
  }

  async createToken(userId: string, email: string, role: string, tenantId?: string) {
    const key = await this.initialize()
    const now = Math.floor(Date.now() / 1000)
    
    const payload = {
      sub: userId,
      email: email,
      role: role,
      tenant_id: tenantId,
      iss: 'auth-service',
      aud: 'authenticated',
      iat: now,
      exp: now + (24 * 60 * 60), // 24 hours
      nbf: now
    }
    
    return await create({ alg: "HS256", typ: "JWT" }, payload, key)
  }

  async verifyToken(token: string) {
    try {
      const key = await this.initialize()
      const payload = await verify(token, key)
      return { valid: true, payload }
    } catch (error) {
      console.error('JWT verification failed:', error)
      return { valid: false, payload: null }
    }
  }

  async refreshToken(token: string) {
    const verification = await this.verifyToken(token)
    if (!verification.valid || !verification.payload) {
      throw new Error('Invalid token')
    }

    const payload = verification.payload
    return await this.createToken(
      payload.sub as string,
      payload.email as string,
      payload.role as string,
      payload.tenant_id as string
    )
  }
}

export const jwtService = new JWTService()

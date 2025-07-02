
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import { config } from "../config/env.ts"

export class JWTService {
  private secret: string

  constructor() {
    this.secret = config.JWT_SECRET
    if (!this.secret) {
      throw new Error('JWT_SECRET is required')
    }
  }

  async createToken(userId: string, email: string, role: string, tenantId?: string): Promise<string> {
    const payload = {
      sub: userId,
      email: email,
      role: role,
      tenant_id: tenantId,
      iss: 'luxmed-auth',
      aud: 'luxmed-app',
      iat: getNumericDate(new Date()),
      exp: getNumericDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
    }

    const header = {
      alg: "HS256" as const,
      typ: "JWT"
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    return await create(header, payload, key)
  }

  async verifyToken(token: string): Promise<{ valid: boolean; payload?: any }> {
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(this.secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      )

      const payload = await verify(token, key)
      return { valid: true, payload }
    } catch (error) {
      console.error('JWT verification error:', error)
      return { valid: false }
    }
  }
}

export const jwtService = new JWTService()

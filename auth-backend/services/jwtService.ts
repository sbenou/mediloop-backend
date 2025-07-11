
import * as jose from "https://deno.land/x/jose@v4.15.5/index.ts"
import { config } from "../config/env.ts"

export class JWTService {
  private secret: Uint8Array

  constructor() {
    const secretString = config.JWT_SECRET
    if (!secretString) {
      throw new Error('JWT_SECRET is required')
    }
    // Convert string secret to Uint8Array for JOSE
    this.secret = new TextEncoder().encode(secretString)
  }

  async createToken(userId: string, email: string, role: string, tenantId?: string): Promise<string> {
    const payload = {
      sub: userId,
      email: email,
      role: role,
      tenant_id: tenantId,
      iss: 'luxmed-auth',
      aud: 'luxmed-app',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    // Create JWT using JOSE
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.secret)

    return jwt
  }

  async verifyToken(token: string): Promise<{ valid: boolean; payload?: any }> {
    try {
      const { payload } = await jose.jwtVerify(token, this.secret, {
        issuer: 'luxmed-auth',
        audience: 'luxmed-app'
      })
      
      return { valid: true, payload }
    } catch (error) {
      console.error('JWT verification error:', error)
      return { valid: false }
    }
  }
}

export const jwtService = new JWTService()

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { enhancedJwtService } from "../services/enhancedJwtService.ts"
import { databaseService } from "../services/databaseService.ts"
import { registrationService } from "../services/registrationService.ts"
import { kvStore } from "../services/kvStore.ts"
import { sessionService } from "../services/sessionService.ts"

const authRoutes = new Router()

// Get client IP helper
function getClientIP(ctx: any): string {
  const forwarded = ctx.request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return ctx.request.ip || 'unknown'
}

// Get User Agent helper
function getUserAgent(ctx: any): string {
  return ctx.request.headers.get('user-agent') || 'unknown'
}

// User registration endpoint (UPDATED - V3 with enhanced JWT)
authRoutes.post('/register', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email, password, fullName, role = 'patient', workplaceName, pharmacyName } = body
    
    if (!email || !password || !fullName) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email, password, and full name are required' }
      return
    }

    const ipAddress = getClientIP(ctx)
    const userAgent = getUserAgent(ctx)

    console.log('V3 Registration: Attempting registration for:', email, 'with role:', role)

    // Register user using our independent service (now includes tenant creation)
    const profile = await registrationService.registerUser(email, password, fullName, role, workplaceName, pharmacyName)

    // Create JWT token with enhanced service
    const tokenData = await enhancedJwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id,
      ipAddress,
      userAgent
    )

    // Store session in KV for backward compatibility
    await kvStore.setSession(tokenData.sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      loginTime: new Date().toISOString()
    })

    console.log('V3 Registration: Registration successful for:', email)

    ctx.response.body = {
      access_token: tokenData.token,
      token_type: 'Bearer',
      expires_in: 86400,
      session_id: tokenData.sessionId,
      expires_at: tokenData.expiresAt.toISOString(),
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        tenant_id: profile.tenant_id
      }
    }
  } catch (error) {
    console.error('V3 Registration error:', error)
    ctx.response.status = 400
    ctx.response.body = { error: error.message || 'Registration failed' }
  }
})

// Login with email/password (UPDATED - V3 with enhanced JWT)
authRoutes.post('/login', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email, password } = body
    
    if (!email || !password) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email and password required' }
      return
    }

    const ipAddress = getClientIP(ctx)
    const userAgent = getUserAgent(ctx)

    console.log('V3 Login: Attempting login for:', email)

    // Verify password using our independent service
    const profile = await databaseService.verifyUserPassword(email, password)

    console.log('V3 Login: Password verification successful for:', email)

    // Get the tenant_id - first check the current schema info
    const tenantResult = await databaseService.getCurrentSchemaInfo()
    let tenantId = null
    
    console.log('V3 Login: Current schema info:', tenantResult)
    
    if (tenantResult && tenantResult.current !== 'public') {
      console.log('V3 Login: Looking up tenant for schema:', tenantResult.current)
      
      // Get tenant record by schema name
      const { postgresService } = await import('../services/postgresService.ts')
      const tenantQuery = await postgresService.query(
        'SELECT id FROM public.tenants WHERE schema = $1 LIMIT 1',
        [tenantResult.current]
      )
      
      console.log('V3 Login: Tenant query result:', tenantQuery.rows)
      
      if (tenantQuery.rows.length > 0) {
        tenantId = tenantQuery.rows[0].id
        console.log('V3 Login: Found tenant_id:', tenantId, 'for schema:', tenantResult.current)
      } else {
        console.log('V3 Login: No tenant found for schema:', tenantResult.current)
      }
    } else {
      console.log('V3 Login: Using public schema, will look up by user domain')
      
      // Fallback: Look up tenant by user ID as domain
      const { postgresService } = await import('../services/postgresService.ts')
      const tenantQuery = await postgresService.query(
        'SELECT id FROM public.tenants WHERE domain = $1 LIMIT 1',
        [profile.id]
      )
      
      console.log('V3 Login: Tenant lookup by user domain result:', tenantQuery.rows)
      
      if (tenantQuery.rows.length > 0) {
        tenantId = tenantQuery.rows[0].id
        console.log('V3 Login: Found tenant_id by domain:', tenantId, 'for user:', profile.id)
      }
    }

    // Create JWT token with enhanced service
    const tokenData = await enhancedJwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      tenantId,
      ipAddress,
      userAgent
    )

    // Store session in KV for backward compatibility
    await kvStore.setSession(tokenData.sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      loginTime: new Date().toISOString()
    })

    console.log('V3 Login: Login successful for:', email, 'with tenant_id:', tenantId)

    ctx.response.body = {
      access_token: tokenData.token,
      token_type: 'Bearer',
      expires_in: 86400,
      session_id: tokenData.sessionId,
      expires_at: tokenData.expiresAt.toISOString(),
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        tenant_id: tenantId
      }
    }
  } catch (error) {
    console.error('V3 Login error:', error)
    
    // Provide user-friendly error messages
    let errorMessage = 'Login failed'
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please check your credentials.'
    } else if (error.message.includes('Profile not found')) {
      errorMessage = 'No account found with this email address. Please sign up first.'
    }
    
    ctx.response.status = 401
    ctx.response.body = { error: errorMessage }
  }
})

// Enhanced logout with token revocation
authRoutes.post('/logout', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verification = await enhancedJwtService.verifyToken(token)
      
      if (verification.valid && verification.payload?.sub) {
        const userId = verification.payload.sub
        
        // Revoke the token
        await enhancedJwtService.revokeToken(token, userId, 'USER_LOGOUT')
        
        console.log('V3 User logged out and token revoked:', userId)
      }
    }

    ctx.response.body = { message: 'Logged out successfully' }
  } catch (error) {
    console.error('Logout error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Logout failed' }
  }
})

// Verify JWT token (using enhanced service)
authRoutes.post('/verify-token', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Authorization header required' }
      return
    }

    const token = authHeader.substring(7)
    const ipAddress = getClientIP(ctx)
    const verification = await enhancedJwtService.verifyToken(token, ipAddress)
    
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { error: verification.error || 'Invalid token' }
      return
    }

    ctx.response.body = { 
      valid: true, 
      payload: verification.payload,
      session_id: verification.session_id 
    }
  } catch (error) {
    console.error('Token verification error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Verification failed' }
  }
})

// Refresh token (using enhanced service)
authRoutes.post('/refresh', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { token } = body
    
    if (!token) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Token required' }
      return
    }

    const ipAddress = getClientIP(ctx)
    const userAgent = getUserAgent(ctx)

    const newTokenData = await enhancedJwtService.refreshToken(token, ipAddress, userAgent)
    
    if (!newTokenData) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid or expired token' }
      return
    }

    // Get fresh user data
    const verification = await enhancedJwtService.verifyToken(newTokenData.token)
    if (verification.valid && verification.payload) {
      const profile = await databaseService.getUserProfile(verification.payload.sub)

      ctx.response.body = {
        access_token: newTokenData.token,
        token_type: 'Bearer',
        expires_in: 86400,
        session_id: newTokenData.sessionId,
        expires_at: newTokenData.expiresAt.toISOString(),
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
          tenant_id: profile.tenant_id
        }
      }
    } else {
      ctx.response.status = 500
      ctx.response.body = { error: 'Failed to validate refreshed token' }
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Refresh failed' }
  }
})

// Get user profile (protected route)
authRoutes.get('/profile', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Authorization header required' }
      return
    }

    const token = authHeader.substring(7)
    const verification = await enhancedJwtService.verifyToken(token)
    
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { error: verification.error || 'Invalid token' }
      return
    }

    const profile = await databaseService.getUserProfile(verification.payload.sub)
    ctx.response.body = { profile }
  } catch (error) {
    console.error('Profile fetch error:', error)
    ctx.response.status = 404
    ctx.response.body = { error: 'Profile not found' }
  }
})

export { authRoutes }

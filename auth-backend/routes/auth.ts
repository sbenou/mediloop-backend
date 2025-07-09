
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { jwtService } from "../services/jwtService.ts"
import { databaseService } from "../services/databaseService.ts"
import { registrationService } from "../services/registrationService.ts"
import { kvStore } from "../services/kvStore.ts"

const authRoutes = new Router()

// User registration endpoint (UPDATED - V2 with tenant creation)
authRoutes.post('/register', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email, password, fullName, role = 'patient', workplaceName, pharmacyName } = body
    
    if (!email || !password || !fullName) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email, password, and full name are required' }
      return
    }

    console.log('V2 Registration: Attempting registration for:', email, 'with role:', role)

    // Register user using our independent service (now includes tenant creation)
    const profile = await registrationService.registerUser(email, password, fullName, role, workplaceName, pharmacyName)

    // Create JWT token
    const jwtToken = await jwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id
    )

    // Store session in KV
    const sessionId = crypto.randomUUID()
    await kvStore.setSession(sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      loginTime: new Date().toISOString()
    })

    console.log('V2 Registration: Registration successful for:', email)

    ctx.response.body = {
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 86400,
      session_id: sessionId,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        tenant_id: profile.tenant_id
      }
    }
  } catch (error) {
    console.error('V2 Registration error:', error)
    ctx.response.status = 400
    ctx.response.body = { error: error.message || 'Registration failed' }
  }
})

// Login with email/password (UPDATED - V2 with proper role handling)
authRoutes.post('/login', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { email, password } = body
    
    if (!email || !password) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Email and password required' }
      return
    }

    console.log('V2 Login: Attempting login for:', email)

    // Verify password using our independent service
    const profile = await databaseService.verifyUserPassword(email, password)

    console.log('V2 Login: Password verification successful for:', email)

    // Create JWT token with proper role information
    const jwtToken = await jwtService.createToken(
      profile.id,
      profile.email,
      profile.role, // This now comes from the roles table join
      profile.tenant_id
    )

    // Store session in KV
    const sessionId = crypto.randomUUID()
    await kvStore.setSession(sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      loginTime: new Date().toISOString()
    })

    console.log('V2 Login: Login successful for:', email)

    ctx.response.body = {
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 86400,
      session_id: sessionId,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        tenant_id: profile.tenant_id
      }
    }
  } catch (error) {
    console.error('V2 Login error:', error)
    
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

// Verify JWT token
authRoutes.post('/verify-token', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Authorization header required' }
      return
    }

    const token = authHeader.substring(7)
    const verification = await jwtService.verifyToken(token)
    
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid token' }
      return
    }

    ctx.response.body = { valid: true, payload: verification.payload }
  } catch (error) {
    console.error('Token verification error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Verification failed' }
  }
})

// Refresh token
authRoutes.post('/refresh', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { token } = body
    
    if (!token) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Token required' }
      return
    }

    const verification = await jwtService.verifyToken(token)
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid token' }
      return
    }

    // Get fresh user data
    const profile = await databaseService.getUserProfile(verification.payload.sub)

    // Create new token
    const newToken = await jwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id
    )

    ctx.response.body = {
      access_token: newToken,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      }
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Refresh failed' }
  }
})

// Logout
authRoutes.post('/logout', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verification = await jwtService.verifyToken(token)
      
      if (verification.valid && verification.payload?.sub) {
        // Could implement token blacklisting here if needed
        console.log('V2 User logged out:', verification.payload.sub)
      }
    }

    ctx.response.body = { message: 'Logged out successfully' }
  } catch (error) {
    console.error('Logout error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Logout failed' }
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
    const verification = await jwtService.verifyToken(token)
    
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid token' }
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

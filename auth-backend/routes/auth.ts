
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { jwtService } from "../services/jwtService.ts"
import { databaseService } from "../services/databaseService.ts"
import { kvStore } from "../services/kvStore.ts"

const authRoutes = new Hono()

// Login with email/password
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }

    // Authenticate with database
    const authData = await databaseService.signInWithPassword(email, password)
    
    // Get user profile
    const profile = await databaseService.getUserProfile(authData.user.id)

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

    return c.json({
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 86400,
      session_id: sessionId,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Verify JWT token
authRoutes.post('/verify', async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json({ error: 'Token required' }, 400)
    }

    const verification = await jwtService.verifyToken(token)
    if (!verification.valid) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    return c.json({ valid: true, payload: verification.payload })
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Refresh token
authRoutes.post('/refresh', async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json({ error: 'Token required' }, 400)
    }

    const verification = await jwtService.verifyToken(token)
    if (!verification.valid) {
      return c.json({ error: 'Invalid token' }, 401)
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

    return c.json({
      access_token: newToken,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({ error: 'Refresh failed' }, 500)
  }
})

// Logout
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const verification = await jwtService.verifyToken(token)
      
      if (verification.valid && verification.payload?.sub) {
        // Could implement token blacklisting here if needed
        console.log('User logged out:', verification.payload.sub)
      }
    }

    return c.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json({ error: 'Logout failed' }, 500)
  }
})

// Get user profile (protected route)
authRoutes.get('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401)
    }

    const token = authHeader.substring(7)
    const verification = await jwtService.verifyToken(token)
    
    if (!verification.valid) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    const profile = await databaseService.getUserProfile(verification.payload.sub)
    return c.json({ profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return c.json({ error: 'Profile not found' }, 404)
  }
})

export { authRoutes }

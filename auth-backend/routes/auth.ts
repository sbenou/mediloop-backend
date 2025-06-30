
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { jwtService } from "../services/jwtService.ts"
import { databaseService } from "../services/databaseService.ts"
import { registrationService } from "../services/registrationService.ts"
import { kvStore } from "../services/kvStore.ts"

const authRoutes = new Hono()

// User registration endpoint (V2 independent)
authRoutes.post('/register', async (c) => {
  try {
    const { email, password, fullName, role = 'patient' } = await c.req.json()
    
    if (!email || !password || !fullName) {
      return c.json({ error: 'Email, password, and full name are required' }, 400)
    }

    console.log('V2 Registration: Attempting registration for:', email)

    // Register user using our independent service
    const profile = await registrationService.registerUser(email, password, fullName, role)

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
    console.error('V2 Registration error:', error)
    return c.json({ error: error.message || 'Registration failed' }, 400)
  }
})

// Login with email/password (V2 independent)
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }

    console.log('V2 Login: Attempting login for:', email)

    // Verify password using our independent service
    const profile = await databaseService.verifyUserPassword(email, password)

    console.log('V2 Login: Password verification successful for:', email)

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

    console.log('V2 Login: Login successful for:', email)

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
    console.error('V2 Login error:', error)
    
    // Provide user-friendly error messages
    let errorMessage = 'Login failed'
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please check your credentials.'
    } else if (error.message.includes('Profile not found')) {
      errorMessage = 'No account found with this email address. Please sign up first.'
    }
    
    return c.json({ error: errorMessage }, 401)
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
        console.log('V2 User logged out:', verification.payload.sub)
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

// Admin routes for user management
authRoutes.get('/admin/users', async (c) => {
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

    // Check if user is admin
    const profile = await databaseService.getUserProfile(verification.payload.sub)
    if (profile.role !== 'superadmin') {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const users = await databaseService.getAllUsers()
    return c.json({ users: users.rows })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// Get roles
authRoutes.get('/admin/roles', async (c) => {
  try {
    const roles = await databaseService.getRoles()
    return c.json({ roles: roles.rows })
  } catch (error) {
    console.error('Get roles error:', error)
    return c.json({ error: 'Failed to fetch roles' }, 500)
  }
})

// Get permissions
authRoutes.get('/admin/permissions', async (c) => {
  try {
    const permissions = await databaseService.getPermissions()
    return c.json({ permissions: permissions.rows })
  } catch (error) {
    console.error('Get permissions error:', error)
    return c.json({ error: 'Failed to fetch permissions' }, 500)
  }
})

export { authRoutes }

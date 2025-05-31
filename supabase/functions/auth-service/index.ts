
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { cors } from "https://deno.land/x/hono@v3.12.11/middleware.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

const app = new Hono()

// CORS middleware
app.use('/*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
}))

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Deno KV
const kv = await Deno.openKv()

// JWT secret for signing tokens
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key'
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
)

// Helper function to create JWT token
async function createJWT(userId: string, email: string, role: string, tenantId?: string) {
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

// Helper function to verify JWT token
async function verifyJWT(token: string) {
  try {
    const payload = await verify(token, key)
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Helper function to get or create user profile
async function getOrCreateUserProfile(email: string, fullName: string, authMethod: string = 'oauth') {
  console.log('Getting or creating user profile for:', email)
  
  // First check if user exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (profileError) {
    console.error('Error checking existing profile:', profileError)
    throw new Error('Database error')
  }

  if (existingProfile) {
    console.log('Found existing user profile:', existingProfile.id)
    return existingProfile
  }

  // Create new user profile
  console.log('Creating new user profile')
  const newUserId = crypto.randomUUID()
  
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: newUserId,
      email: email,
      full_name: fullName,
      role: 'patient', // Default role
      auth_method: authMethod,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating user profile:', createError)
    throw new Error('Failed to create user profile')
  }

  console.log('Created new user profile:', newProfile.id)
  return newProfile
}

// OAuth configuration
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const FRANCECONNECT_CLIENT_ID = Deno.env.get('FRANCECONNECT_CLIENT_ID')
const FRANCECONNECT_CLIENT_SECRET = Deno.env.get('FRANCECONNECT_CLIENT_SECRET')
const LUXTRUST_CLIENT_ID = Deno.env.get('LUXTRUST_CLIENT_ID')
const LUXTRUST_CLIENT_SECRET = Deno.env.get('LUXTRUST_CLIENT_SECRET')

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// LuxTrust ID verification endpoint with Deno KV
app.post('/luxtrust/verify-id', async (c) => {
  try {
    const { luxtrustId } = await c.req.json()
    console.log('LuxTrust ID verification request for:', luxtrustId)
    
    // Validate LuxTrust ID format
    const patterns = [
      /^LUX-\d{4}-\d{6}$/,
      /^LT-[A-Z]{3}-\d{6}$/,
      /^LUXTRUST-\d{6}$/,
      /^TEST-LUX-ID-\d{6}$/
    ]
    
    const isValidFormat = patterns.some(pattern => pattern.test(luxtrustId))
    
    if (!isValidFormat) {
      return c.json({
        success: false,
        status: 'failed',
        error: 'Invalid LuxTrust ID format',
        timestamp: new Date().toISOString()
      })
    }

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock verification - 90% success rate for demo
    const isVerificationSuccessful = Math.random() > 0.1
    
    const sessionId = crypto.randomUUID()
    const verificationResponse = {
      success: isVerificationSuccessful,
      status: isVerificationSuccessful ? 'verified' : 'failed',
      luxtrustId: luxtrustId,
      verificationId: `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      sessionId: sessionId
    }

    // Store the verification result in Deno KV
    const kvKey = ['luxtrust_id_verification', sessionId]
    await kv.set(kvKey, verificationResponse, { expireIn: 3600000 }) // 1 hour expiry

    console.log('LuxTrust ID verification completed, stored in KV with session:', sessionId)

    return c.json(verificationResponse)
  } catch (error) {
    console.error('LuxTrust ID verification error:', error)
    return c.json({ 
      success: false, 
      status: 'failed',
      error: 'LuxTrust ID verification failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Professional certification upload endpoint with Deno KV
app.post('/certification/upload', async (c) => {
  try {
    const { fileName, certificationType, userId } = await c.req.json()
    console.log('Certification upload request:', fileName, certificationType)
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const sessionId = crypto.randomUUID()
    const certificationResponse = {
      success: true,
      certification: {
        id: `cert-${Date.now()}`,
        fileName: fileName,
        type: certificationType,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
        userId: userId
      },
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }

    // Store the certification result in Deno KV
    const kvKey = ['certification_upload', sessionId]
    await kv.set(kvKey, certificationResponse, { expireIn: 3600000 }) // 1 hour expiry

    console.log('Certification upload completed, stored in KV with session:', sessionId)

    return c.json(certificationResponse)
  } catch (error) {
    console.error('Certification upload error:', error)
    return c.json({ 
      success: false, 
      error: 'Certification upload failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Professional certification verification endpoint with Deno KV
app.post('/certification/verify', async (c) => {
  try {
    const { certificationId } = await c.req.json()
    console.log('Certification verification request for:', certificationId)
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const sessionId = crypto.randomUUID()
    const verificationResponse = {
      success: true,
      verificationId: `LUX-VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      certificationId: certificationId,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }

    // Store the verification result in Deno KV
    const kvKey = ['certification_verification', sessionId]
    await kv.set(kvKey, verificationResponse, { expireIn: 3600000 }) // 1 hour expiry

    console.log('Certification verification completed, stored in KV with session:', sessionId)

    return c.json(verificationResponse)
  } catch (error) {
    console.error('Certification verification error:', error)
    return c.json({ 
      success: false, 
      error: 'Certification verification failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Location detection endpoint with Deno KV
app.post('/location/detect', async (c) => {
  try {
    const { countryCode } = await c.req.json()
    console.log('Location detection request for:', countryCode)
    
    // Simulate location detection process
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const sessionId = crypto.randomUUID()
    const locationResponse = {
      success: true,
      detectedCountry: countryCode,
      isLuxembourg: countryCode === 'LU',
      luxtrustAvailable: countryCode === 'LU',
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }

    // Store the location result in Deno KV
    const kvKey = ['location_detection', sessionId]
    await kv.set(kvKey, locationResponse, { expireIn: 3600000 }) // 1 hour expiry

    console.log('Location detection completed, stored in KV with session:', sessionId)

    return c.json(locationResponse)
  } catch (error) {
    console.error('Location detection error:', error)
    return c.json({ 
      success: false, 
      error: 'Location detection failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// LuxTrust authentication endpoint with Deno KV
app.post('/luxtrust/auth', async (c) => {
  try {
    console.log('LuxTrust authentication request received')
    
    // Simulate LuxTrust authentication process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate a unique session ID
    const sessionId = crypto.randomUUID()
    
    // Mock successful LuxTrust response
    const luxtrustResponse = {
      success: true,
      profile: {
        id: `lux-${Date.now()}`,
        firstName: 'Dr. Jean',
        lastName: 'Luxembourg',
        professionalId: 'LUX-DOC-2024-001',
        certificationLevel: 'professional' as const,
        isVerified: true
      },
      signature: `LuxTrust-Signature-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verificationId: `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      sessionId: sessionId
    }

    // Store the authentication result in Deno KV
    const kvKey = ['luxtrust_auth', sessionId]
    await kv.set(kvKey, luxtrustResponse, { expireIn: 3600000 }) // 1 hour expiry

    console.log('LuxTrust authentication successful, stored in KV with session:', sessionId)

    return c.json(luxtrustResponse)
  } catch (error) {
    console.error('LuxTrust authentication error:', error)
    return c.json({ 
      success: false, 
      error: 'LuxTrust authentication failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Handle POST requests with action parameter for backward compatibility
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    if (body.action === 'luxtrust_auth') {
      // Redirect to the specific LuxTrust endpoint
      return await app.fetch(new Request(`${c.req.url}luxtrust/auth`, {
        method: 'POST',
        headers: c.req.headers,
        body: JSON.stringify(body)
      }))
    }
    
    return c.json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('Request processing error:', error)
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// JWT verification endpoint
app.post('/verify', async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json({ error: 'Token required' }, 400)
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    return c.json({ valid: true, payload })
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// Token refresh endpoint
app.post('/refresh', async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json({ error: 'Token required' }, 400)
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    // Get fresh user data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single()

    if (error || !profile) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Create new token
    const newToken = await createJWT(
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

// Google OAuth initiation
app.get('/oauth/google', (c) => {
  const redirectUri = `${supabaseUrl}/functions/v1/auth-service/oauth/google/callback`
  const scope = 'openid email profile'
  const state = crypto.randomUUID()
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  
  return c.redirect(authUrl.toString())
})

// Google OAuth callback
app.get('/oauth/google/callback', async (c) => {
  try {
    const code = c.req.query('code')
    const state = c.req.query('state')
    
    if (!code) {
      return c.json({ error: 'Authorization code required' }, 400)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${supabaseUrl}/functions/v1/auth-service/oauth/google/callback`
      })
    })

    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      console.error('Token exchange failed:', tokens)
      return c.json({ error: 'Token exchange failed' }, 400)
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    const googleUser = await userResponse.json()
    console.log('Google user info:', googleUser)

    // Create or get user profile
    const profile = await getOrCreateUserProfile(
      googleUser.email,
      googleUser.name,
      'google'
    )

    // Create JWT token
    const jwtToken = await createJWT(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id
    )

    // Redirect to frontend with token
    const frontendUrl = c.req.header('origin') || 'http://localhost:5173'
    return c.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`)

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return c.json({ error: 'OAuth callback failed' }, 500)
  }
})

// FranceConnect OAuth initiation
app.get('/oauth/franceconnect', (c) => {
  const redirectUri = `${supabaseUrl}/functions/v1/auth-service/oauth/franceconnect/callback`
  const scope = 'openid email profile'
  const state = crypto.randomUUID()
  
  const authUrl = new URL('https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize')
  authUrl.searchParams.set('client_id', FRANCECONNECT_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  
  return c.redirect(authUrl.toString())
})

// FranceConnect OAuth callback
app.get('/oauth/franceconnect/callback', async (c) => {
  try {
    const code = c.req.query('code')
    
    if (!code) {
      return c.json({ error: 'Authorization code required' }, 400)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://fcp.integ01.dev-franceconnect.fr/api/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: FRANCECONNECT_CLIENT_ID!,
        client_secret: FRANCECONNECT_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${supabaseUrl}/functions/v1/auth-service/oauth/franceconnect/callback`
      })
    })

    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      console.error('FranceConnect token exchange failed:', tokens)
      return c.json({ error: 'Token exchange failed' }, 400)
    }

    // Get user info from FranceConnect
    const userResponse = await fetch('https://fcp.integ01.dev-franceconnect.fr/api/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    const fcUser = await userResponse.json()
    console.log('FranceConnect user info:', fcUser)

    // Create or get user profile
    const profile = await getOrCreateUserProfile(
      fcUser.email,
      `${fcUser.given_name} ${fcUser.family_name}`,
      'franceconnect'
    )

    // Create JWT token
    const jwtToken = await createJWT(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id
    )

    // Redirect to frontend with token
    const frontendUrl = c.req.header('origin') || 'http://localhost:5173'
    return c.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`)

  } catch (error) {
    console.error('FranceConnect OAuth callback error:', error)
    return c.json({ error: 'OAuth callback failed' }, 500)
  }
})

// LuxTrust OAuth initiation (placeholder - will need actual LuxTrust endpoints)
app.get('/oauth/luxtrust', (c) => {
  // Note: This is a placeholder - actual LuxTrust endpoints would need to be configured
  return c.json({ error: 'LuxTrust integration not yet configured' }, 501)
})

// Authentication middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header required' }, 401)
  }

  const token = authHeader.substring(7)
  const payload = await verifyJWT(token)
  
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('user', payload)
  await next()
}

// Protected route example
app.get('/user/profile', authMiddleware, async (c) => {
  const user = c.get('user')
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.sub)
    .single()

  if (error) {
    return c.json({ error: 'Profile not found' }, 404)
  }

  return c.json({ profile })
})

// Email/password login endpoint
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }

    // Use Supabase Auth for email/password verification
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    // Create JWT token
    const jwtToken = await createJWT(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id
    )

    return c.json({
      access_token: jwtToken,
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
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Logout endpoint
app.post('/logout', authMiddleware, async (c) => {
  // In a production system, you might want to maintain a token blacklist
  // For now, we'll just return success as JWT tokens are stateless
  return c.json({ message: 'Logged out successfully' })
})

console.log('Auth service starting...')

serve(app.fetch)

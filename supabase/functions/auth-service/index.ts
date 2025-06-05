
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

console.log('Auth service starting...')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

serve(async (req) => {
  console.log('Auth service request received:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    // Health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        service: 'auth-service',
        timestamp: new Date().toISOString() 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Email/password login endpoint
    if (path === '/login' && req.method === 'POST') {
      const { email, password } = await req.json()
      
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Use Supabase Auth for email/password verification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create JWT token
      const jwtToken = await createJWT(
        profile.id,
        profile.email,
        profile.role,
        profile.tenant_id
      )

      return new Response(JSON.stringify({
        access_token: jwtToken,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // JWT verification endpoint
    if (path === '/verify' && req.method === 'POST') {
      const { token } = await req.json()
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const payload = await verifyJWT(token)
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ valid: true, payload }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Token refresh endpoint
    if (path === '/refresh' && req.method === 'POST') {
      const { token } = await req.json()
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const payload = await verifyJWT(token)
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get fresh user data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', payload.sub)
        .single()

      if (error || !profile) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create new token
      const newToken = await createJWT(
        profile.id,
        profile.email,
        profile.role,
        profile.tenant_id
      )

      return new Response(JSON.stringify({
        access_token: newToken,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // OAuth configuration
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const FRANCECONNECT_CLIENT_ID = Deno.env.get('FRANCECONNECT_CLIENT_ID')
    const FRANCECONNECT_CLIENT_SECRET = Deno.env.get('FRANCECONNECT_CLIENT_SECRET')

    // Google OAuth initiation
    if (path === '/oauth/google' && req.method === 'GET') {
      const redirectUri = `${supabaseUrl}/functions/v1/auth-service/oauth/google/callback`
      const scope = 'openid email profile'
      const state = crypto.randomUUID()
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID!)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('state', state)
      
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': authUrl.toString() }
      })
    }

    // Google OAuth callback
    if (path === '/oauth/google/callback' && req.method === 'GET') {
      const url = new URL(req.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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
        return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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
      const frontendUrl = req.headers.get('origin') || 'http://localhost:5173'
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': `${frontendUrl}/auth/callback?token=${jwtToken}` }
      })
    }

    // FranceConnect OAuth initiation
    if (path === '/oauth/franceconnect' && req.method === 'GET') {
      const redirectUri = `${supabaseUrl}/functions/v1/auth-service/oauth/franceconnect/callback`
      const scope = 'openid email profile'
      const state = crypto.randomUUID()
      
      const authUrl = new URL('https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize')
      authUrl.searchParams.set('client_id', FRANCECONNECT_CLIENT_ID!)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('state', state)
      
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': authUrl.toString() }
      })
    }

    // FranceConnect OAuth callback
    if (path === '/oauth/franceconnect/callback' && req.method === 'GET') {
      const url = new URL(req.url)
      const code = url.searchParams.get('code')
      
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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
        return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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
      const frontendUrl = req.headers.get('origin') || 'http://localhost:5173'
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': `${frontendUrl}/auth/callback?token=${jwtToken}` }
      })
    }

    // Logout endpoint
    if (path === '/logout' && req.method === 'POST') {
      return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // User profile endpoint (protected)
    if (path === '/user/profile' && req.method === 'GET') {
      const authHeader = req.headers.get('Authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authorization header required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const token = authHeader.substring(7)
      const payload = await verifyJWT(token)
      
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', payload.sub)
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ profile }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Auth service error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

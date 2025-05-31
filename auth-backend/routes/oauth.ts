
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { config } from "../config/env.ts"
import { jwtService } from "../services/jwtService.ts"
import { databaseService } from "../services/databaseService.ts"
import { kvStore } from "../services/kvStore.ts"

const oauthRoutes = new Hono()

// Google OAuth initiation
oauthRoutes.get('/google', (c) => {
  const redirectUri = `${config.SERVICE_URL}/oauth/google/callback`
  const scope = 'openid email profile'
  const state = crypto.randomUUID()
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', config.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  
  return c.redirect(authUrl.toString())
})

// Google OAuth callback
oauthRoutes.get('/google/callback', async (c) => {
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
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${config.SERVICE_URL}/oauth/google/callback`
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
    const profile = await databaseService.getOrCreateUserProfile(
      googleUser.email,
      googleUser.name,
      'google'
    )

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
      authMethod: 'google',
      loginTime: new Date().toISOString()
    })

    // Redirect to frontend with token
    return c.redirect(`${config.FRONTEND_URL}/auth/callback?token=${jwtToken}`)

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return c.json({ error: 'OAuth callback failed' }, 500)
  }
})

// FranceConnect OAuth initiation
oauthRoutes.get('/franceconnect', (c) => {
  const redirectUri = `${config.SERVICE_URL}/oauth/franceconnect/callback`
  const scope = 'openid email profile'
  const state = crypto.randomUUID()
  
  const authUrl = new URL('https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize')
  authUrl.searchParams.set('client_id', config.FRANCECONNECT_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  
  return c.redirect(authUrl.toString())
})

// FranceConnect OAuth callback
oauthRoutes.get('/franceconnect/callback', async (c) => {
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
        client_id: config.FRANCECONNECT_CLIENT_ID,
        client_secret: config.FRANCECONNECT_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${config.SERVICE_URL}/oauth/franceconnect/callback`
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
    const profile = await databaseService.getOrCreateUserProfile(
      fcUser.email,
      `${fcUser.given_name} ${fcUser.family_name}`,
      'franceconnect'
    )

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
      authMethod: 'franceconnect',
      loginTime: new Date().toISOString()
    })

    // Redirect to frontend with token
    return c.redirect(`${config.FRONTEND_URL}/auth/callback?token=${jwtToken}`)

  } catch (error) {
    console.error('FranceConnect OAuth callback error:', error)
    return c.json({ error: 'OAuth callback failed' }, 500)
  }
})

// LuxTrust OAuth placeholder
oauthRoutes.get('/luxtrust', (c) => {
  // Note: This is a placeholder - actual LuxTrust endpoints would need to be configured
  return c.json({ error: 'LuxTrust OAuth integration not yet configured' }, 501)
})

export { oauthRoutes }


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { cors } from "https://deno.land/x/hono@v3.12.11/middleware.ts"

const app = new Hono()

// Enhanced CORS middleware
app.use('/*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  credentials: false
}))

// Handle OPTIONS requests explicitly
app.options('/*', (c) => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      'Access-Control-Max-Age': '86400'
    }
  })
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', service: 'luxtrust-service', timestamp: new Date().toISOString() })
})

// Main handler for all requests - now handles both direct path calls and action-based calls
app.post('/*', async (c) => {
  try {
    const body = await c.req.json()
    const path = c.req.path
    
    // Determine action from either the path or the body
    let action = body.action
    if (path.includes('/auth')) {
      action = 'auth'
    } else if (path.includes('/verify-id')) {
      action = 'verify-id'
    }
    
    console.log('LuxTrust service request:', { action, path })
    
    if (action === 'auth') {
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

      console.log('LuxTrust authentication successful with session:', sessionId)
      return c.json(luxtrustResponse)
      
    } else if (action === 'verify-id') {
      const { luxtrustId } = body
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

      console.log('LuxTrust ID verification completed with session:', sessionId)
      return c.json(verificationResponse)
    }
    
    return c.json({ 
      success: false, 
      error: 'Unknown action or endpoint',
      timestamp: new Date().toISOString()
    }, 400)
    
  } catch (error) {
    console.error('LuxTrust service error:', error)
    return c.json({ 
      success: false, 
      error: 'Service error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Legacy path handlers for backward compatibility
app.post('/auth', async (c) => {
  return app.fetch(new Request(c.req.url.replace('/auth', ''), {
    method: 'POST',
    headers: c.req.headers,
    body: JSON.stringify({ action: 'auth', ...(await c.req.json()) })
  }))
})

app.post('/verify-id', async (c) => {
  const body = await c.req.json()
  return app.fetch(new Request(c.req.url.replace('/verify-id', ''), {
    method: 'POST',
    headers: c.req.headers,
    body: JSON.stringify({ action: 'verify-id', ...body })
  }))
})

console.log('LuxTrust Service starting...')

serve(app.fetch)

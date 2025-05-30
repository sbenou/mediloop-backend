
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Deno KV with fallback
let kv: any = null
try {
  kv = await Deno.openKv()
  console.log('Deno KV initialized successfully')
} catch (error) {
  console.warn('Deno KV not available, falling back to in-memory storage:', error.message)
}

// Fallback storage for when KV is not available
const memoryStorage = new Map()

// Helper functions for storage abstraction
async function setJob(jobId: string, data: any) {
  if (kv) {
    await kv.set(['luxtrust_jobs', jobId], data)
  } else {
    memoryStorage.set(jobId, data)
  }
}

async function getJob(jobId: string) {
  if (kv) {
    const result = await kv.get(['luxtrust_jobs', jobId])
    return result
  } else {
    return { value: memoryStorage.get(jobId) || null }
  }
}

async function enqueueJob(data: any) {
  if (kv) {
    await kv.enqueue(data)
  } else {
    // Process immediately in memory fallback
    setTimeout(() => processLuxTrustJob(data), 100)
  }
}

// LuxTrust authentication processing function
async function processLuxTrustAuth(luxtrustId: string, testMode: boolean = false): Promise<any> {
  console.log('Processing LuxTrust authentication for:', luxtrustId)
  
  // Simulate LuxTrust API call delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  if (testMode) {
    // Mock successful response for testing
    return {
      success: true,
      profile: {
        id: `lux-${Date.now()}`,
        firstName: 'Dr. Jean',
        lastName: 'Luxembourg',
        professionalId: 'LUX-DOC-2024-001',
        certificationLevel: 'professional',
        isVerified: true
      },
      signature: `LuxTrust-Signature-${Date.now()}`,
      verificationId: `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }
  }
  
  // In production, this would make actual LuxTrust API calls
  return {
    success: false,
    error: 'LuxTrust integration not yet configured for production'
  }
}

// LuxTrust authentication queue handler
async function processLuxTrustJob(msg: any) {
  if (msg.type === 'luxtrust_auth') {
    const { jobId, luxtrustId, testMode } = msg
    
    console.log('Processing LuxTrust authentication job:', jobId)
    
    try {
      // Update job status to processing
      await setJob(jobId, {
        status: 'processing',
        luxtrustId,
        testMode,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString()
      })

      // Process the authentication
      const result = await processLuxTrustAuth(luxtrustId, testMode)
      
      // Update job with results
      if (result.success) {
        await setJob(jobId, {
          status: 'completed',
          luxtrustId,
          testMode,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          profile: result.profile,
          signature: result.signature,
          verificationId: result.verificationId
        })
        console.log('LuxTrust authentication completed successfully:', jobId)
      } else {
        await setJob(jobId, {
          status: 'failed',
          luxtrustId,
          testMode,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          failedAt: new Date().toISOString(),
          error: result.error || 'Authentication failed'
        })
        console.log('LuxTrust authentication failed:', jobId, result.error)
      }
    } catch (error) {
      console.error('LuxTrust authentication job error:', jobId, error)
      
      // Update job with error
      await setJob(jobId, {
        status: 'failed',
        luxtrustId,
        testMode,
        createdAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        error: error.message || 'Processing error'
      })
    }
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  const url = new URL(req.url)
  const path = url.pathname

  console.log(`${req.method} ${path}`)

  try {
    // Health check endpoint
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        kvAvailable: kv !== null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // LuxTrust authentication initiation endpoint
    if (path === '/luxtrust/auth' && req.method === 'POST') {
      const { luxtrustId, testMode = false } = await req.json()
      
      if (!luxtrustId) {
        return new Response(JSON.stringify({ error: 'LuxTrust ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Generate job ID
      const jobId = `luxtrust-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      
      // Store job with initial status
      await setJob(jobId, {
        status: 'pending',
        luxtrustId,
        testMode,
        createdAt: new Date().toISOString()
      })

      // Queue the authentication job
      await enqueueJob({
        type: 'luxtrust_auth',
        jobId,
        luxtrustId,
        testMode
      })

      console.log('LuxTrust authentication job queued:', jobId)

      return new Response(JSON.stringify({ 
        jobId,
        status: 'queued',
        message: 'LuxTrust authentication job has been queued'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // LuxTrust authentication status endpoint
    if (path.startsWith('/luxtrust/status/') && req.method === 'GET') {
      const jobId = path.split('/').pop()
      
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'Job ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const jobData = await getJob(jobId)
      
      if (!jobData.value) {
        return new Response(JSON.stringify({ error: 'Job not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(jobData.value), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default 404 response
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Request error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Set up queue listener if KV is available
if (kv) {
  kv.listenQueue(processLuxTrustJob)
  console.log('Deno KV queue listener started')
} else {
  console.log('Running without Deno KV queue, using immediate processing')
}

console.log('Auth service starting with LuxTrust queue support...')

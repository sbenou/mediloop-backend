
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

// In-memory storage for jobs (for testing purposes)
const jobs = new Map()

// Process LuxTrust authentication job
async function processLuxTrustJob(jobId: string) {
  console.log('Processing LuxTrust job:', jobId)
  
  try {
    const jobData = jobs.get(jobId)
    if (!jobData) {
      console.error('Job not found:', jobId)
      return
    }

    // Update job status to processing
    const processingData = {
      ...jobData,
      status: 'processing',
      updatedAt: new Date().toISOString()
    }
    jobs.set(jobId, processingData)
    
    // Simulate LuxTrust authentication process (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock successful authentication response
    const authResponse = {
      success: true,
      profile: {
        id: `lux-${Date.now()}`,
        firstName: 'Dr. Jean',
        lastName: 'Luxembourg',
        professionalId: jobData.luxtrustId,
        certificationLevel: 'professional',
        isVerified: true
      },
      signature: `LuxTrust-Signature-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verificationId: `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }
    
    // Update job with completed status and result
    const completedData = {
      ...jobData,
      status: 'completed',
      result: authResponse,
      updatedAt: new Date().toISOString()
    }
    
    jobs.set(jobId, completedData)
    console.log('LuxTrust job completed:', jobId)
    
  } catch (error) {
    console.error('Error processing LuxTrust job:', error)
    
    const jobData = jobs.get(jobId)
    if (jobData) {
      // Update job with failed status
      const failedData = {
        ...jobData,
        status: 'failed',
        error: error.message,
        updatedAt: new Date().toISOString()
      }
      
      jobs.set(jobId, failedData)
    }
  }
}

serve(async (req) => {
  console.log('Request received:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // LuxTrust Authentication - Start authentication process
    if (path === '/luxtrust/auth' && req.method === 'POST') {
      const { luxtrustId } = await req.json()
      
      if (!luxtrustId) {
        return new Response(
          JSON.stringify({ error: 'LuxTrust ID required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('Starting LuxTrust authentication for ID:', luxtrustId)

      // Create a unique job ID
      const jobId = crypto.randomUUID()
      
      // Store the job in memory with initial status
      const jobData = {
        id: jobId,
        luxtrustId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      jobs.set(jobId, jobData)
      
      // Process job asynchronously
      setTimeout(async () => {
        await processLuxTrustJob(jobId)
      }, 100)
      
      console.log('Created LuxTrust authentication job:', jobId)
      
      return new Response(
        JSON.stringify({ jobId, status: 'pending' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // LuxTrust Authentication - Check job status
    if (path.startsWith('/luxtrust/status/') && req.method === 'GET') {
      const jobId = path.split('/').pop()
      
      if (!jobId) {
        return new Response(
          JSON.stringify({ error: 'Job ID required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('Checking status for job:', jobId)

      // Get job from memory
      const jobData = jobs.get(jobId)
      
      if (!jobData) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      console.log('Retrieved job status:', jobData.status, 'for job:', jobId)
      
      return new Response(
        JSON.stringify(jobData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Health check endpoint
    if (path === '/health' || path === '/') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          service: 'auth-service' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Route not found
    return new Response(
      JSON.stringify({ 
        error: 'Route not found',
        path: path,
        method: req.method,
        availableRoutes: ['/health', '/luxtrust/auth', '/luxtrust/status/{jobId}']
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    )

  } catch (error) {
    console.error('Request processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

console.log('Auth service starting on port 8000...')

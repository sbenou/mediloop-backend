
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { cors } from "https://deno.land/x/hono@v3.12.11/middleware.ts"

const app = new Hono()

// CORS middleware
app.use('/*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
}))

// Initialize Deno KV
const kv = await Deno.openKv()

// LuxTrust Authentication - Start authentication process
app.post('/luxtrust/auth', async (c) => {
  try {
    const { luxtrustId } = await c.req.json()
    
    if (!luxtrustId) {
      return c.json({ error: 'LuxTrust ID required' }, 400)
    }

    console.log('Starting LuxTrust authentication for ID:', luxtrustId)

    // Create a unique job ID
    const jobId = crypto.randomUUID()
    
    // Store the job in Deno KV with initial status
    const jobData = {
      id: jobId,
      luxtrustId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(['luxtrust_jobs', jobId], jobData)
    
    // Add job to processing queue
    await kv.enqueue(jobData, { delay: 100 }) // Small delay to allow client to start polling
    
    console.log('Created LuxTrust authentication job:', jobId)
    
    return c.json({ jobId, status: 'pending' })
  } catch (error) {
    console.error('LuxTrust auth error:', error)
    return c.json({ error: 'Failed to start authentication' }, 500)
  }
})

// LuxTrust Authentication - Check job status
app.get('/luxtrust/status/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId')
    
    if (!jobId) {
      return c.json({ error: 'Job ID required' }, 400)
    }

    console.log('Checking status for job:', jobId)

    // Get job from Deno KV
    const result = await kv.get(['luxtrust_jobs', jobId])
    
    if (!result.value) {
      return c.json({ error: 'Job not found' }, 404)
    }

    const jobData = result.value as any
    console.log('Retrieved job status:', jobData.status, 'for job:', jobId)
    
    return c.json(jobData)
  } catch (error) {
    console.error('Status check error:', error)
    return c.json({ error: 'Failed to check status' }, 500)
  }
})

// Queue listener for processing LuxTrust authentication jobs
kv.listenQueue(async (message) => {
  const jobData = message as any
  console.log('Processing LuxTrust job:', jobData.id)
  
  try {
    // Update job status to processing
    const processingData = {
      ...jobData,
      status: 'processing',
      updatedAt: new Date().toISOString()
    }
    await kv.set(['luxtrust_jobs', jobData.id], processingData)
    
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
    
    await kv.set(['luxtrust_jobs', jobData.id], completedData)
    console.log('LuxTrust job completed:', jobData.id)
    
  } catch (error) {
    console.error('Error processing LuxTrust job:', error)
    
    // Update job with failed status
    const failedData = {
      ...jobData,
      status: 'failed',
      error: error.message,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(['luxtrust_jobs', jobData.id], failedData)
  }
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

console.log('Auth service starting...')

serve(app.fetch)

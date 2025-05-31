
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts"
import { cors } from "https://deno.land/x/hono@v3.12.11/middleware.ts"
import { authRoutes } from "./routes/auth.ts"
import { luxtrustRoutes } from "./routes/luxtrust.ts"
import { oauthRoutes } from "./routes/oauth.ts"

const app = new Hono()

// CORS middleware
app.use('/*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'auth-backend',
    timestamp: new Date().toISOString() 
  })
})

// Mount route groups
app.route('/auth', authRoutes)
app.route('/luxtrust', luxtrustRoutes)
app.route('/oauth', oauthRoutes)

console.log('Auth Backend Service starting on port 8000...')

serve(app.fetch, { port: 8000 })

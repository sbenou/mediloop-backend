
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"
import { loadConfig } from "./config/env.ts"
import { authMiddleware } from "./middleware/authMiddleware.ts"
import { oauthRoutes } from "./routes/oauth.ts"

import healthCheckRouter from "./routes/healthCheck.ts"
import { authRoutes } from "./routes/auth.ts"
import tenantTestingRouter from "./routes/tenantTesting.ts"
import migrationRouter from "./routes/migrations.ts"

console.log('🚀 Starting Deno server with HashiCorp Vault integration...');

// Load configuration (including secrets from Vault)
const config = await loadConfig();

const app = new Application()
const router = new Router()

const PORT = config.PORT;
console.log(`Server will start on port: ${PORT} (${config.ENVIRONMENT} mode)`);

// Enable CORS for all routes
app.use(oakCors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Logger
app.use(async (ctx, next) => {
  await next()
  const rt = ctx.response.headers.get("X-Response-Time")
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`)
})

// Timing
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  ctx.response.headers.set("X-Response-Time", `${ms}ms`)
})

// Error handler
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.response.status = err.status || 500
    ctx.response.body = { message: err.message }
    ctx.response.type = "json"
    console.error("Error:", err)
  }
})

// Test route
router.get("/", (ctx) => {
  ctx.response.body = "Hello world! Vault integration active."
})

// Protected route (example)
router.get("/protected", authMiddleware, (ctx) => {
  ctx.response.body = {
    message: "Protected route accessed!",
    user: ctx.state.user
  }
})

// Protected user profile route
router.get("/api/me", authMiddleware, (ctx) => {
  ctx.response.body = {
    user: ctx.state.user,
    timestamp: new Date().toISOString()
  }
})

// Add routes
app.use(healthCheckRouter.routes())
app.use(authRoutes.routes())
app.use(tenantTestingRouter.routes())
app.use(migrationRouter.routes())
app.use(healthCheckRouter.allowedMethods())
app.use(authRoutes.allowedMethods())
app.use(tenantTestingRouter.allowedMethods())
app.use(migrationRouter.allowedMethods())

// OAuth routes
app.use(oauthRoutes.routes())
app.use(oauthRoutes.allowedMethods())

app.use(router.routes())
app.use(router.allowedMethods())

console.log(`🔐 Vault integration ready`)
console.log(`🚀 Server running on http://localhost:${PORT}`)

try {
  await app.listen({ port: PORT })
} catch (error) {
  console.error('❌ Failed to start server:', error);
  Deno.exit(1);
}

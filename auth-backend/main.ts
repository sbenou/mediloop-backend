import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"
import { config } from "./config/env.ts"
import { authMiddleware } from "./middleware/authMiddleware.ts"
import { oauthRoutes } from "./routes/oauth.ts"

import healthCheckRouter from "./routes/healthCheck.ts"
import { authRoutes } from "./routes/auth.ts"
import tenantTestingRouter from "./routes/tenantTesting.ts"

const app = new Application()
const router = new Router()

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
  ctx.response.body = "Hello world!"
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
app.use(healthCheckRouter.allowedMethods())
app.use(authRoutes.allowedMethods())
app.use(tenantTestingRouter.allowedMethods())

// OAuth routes
app.use(oauthRoutes.routes())
app.use(oauthRoutes.allowedMethods())

app.use(router.routes())
app.use(router.allowedMethods())

console.log(`Server running on port ${config.PORT}`)
await app.listen({ port: config.PORT })


import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { authRoutes } from './routes/auth.ts'
import { tokenRoutes } from './routes/tokenManagement.ts';
import { tokenRotationRoutes } from './routes/tokenRotation.ts'
import { domainVerificationRoutes } from './routes/domainVerification.ts'
import { config } from "./config/env.ts"
import { authMiddleware } from "./middleware/authMiddleware.ts"
import { tokenBlacklistMiddleware } from "./middleware/tokenBlacklistMiddleware.ts"
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import emailTemplateRoutes from "./routes/emailTemplates.ts"
import loginEmailRoutes from "./routes/loginEmails.ts"
import { passwordResetRoutes } from './routes/passwordReset.ts'
import { tokenRotationService } from './services/tokenRotationService.ts'

const app = new Application()

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

// Enable CORS for All Origins
app.use(oakCors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Error handling
app.use(async (ctx: Context, next: () => Promise<void>) => {
  try {
    await next()
  } catch (err) {
    console.error('Global error handler:', err)
    ctx.response.status = err.status || 500
    ctx.response.body = { error: err.message || 'Internal Server Error' }
    ctx.response.type = 'json'
  }
})

// Middleware to check for blacklisted tokens
app.use(tokenBlacklistMiddleware)

// Authentication middleware (apply to specific routes)
app.use(authMiddleware)

// Routes
app.use(authRoutes.routes())
app.use(authRoutes.allowedMethods())

app.use(tokenRoutes.routes());
app.use(tokenRoutes.allowedMethods());

app.use(tokenRotationRoutes.routes())
app.use(tokenRotationRoutes.allowedMethods())

app.use(passwordResetRoutes.routes())
app.use(passwordResetRoutes.allowedMethods())

app.use(domainVerificationRoutes.routes())
app.use(domainVerificationRoutes.allowedMethods())

app.use(emailTemplateRoutes.routes())
app.use(emailTemplateRoutes.allowedMethods())

app.use(loginEmailRoutes.routes())
app.use(loginEmailRoutes.allowedMethods())

// Health check route
const router = new Router()
router.get('/health', (ctx) => {
  ctx.response.body = { status: 'ok', version: '3.0' }
})

app.use(router.routes())
app.use(router.allowedMethods())

// Start automatic token rotation cron job
console.log('[TokenRotation] Starting automatic token rotation service')
Deno.cron("Token Rotation", "*/5 * * * *", async () => {
  console.log('[TokenRotation] Running scheduled token rotation check')
  await tokenRotationService.processScheduledRotations()
})

// Start server
const port = parseInt(config.PORT || Deno.env.get('PORT') || '8000')
console.log(`Server running on port ${port}`)
console.log(`Automatic token rotation enabled (runs every 5 minutes)`)
await app.listen({ port })

import { Application, Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { authRoutes } from './routes/auth.ts'
import { tokenManagementRoutes } from './routes/tokenManagement.ts'
import { config } from "./config/env.ts"
import { authMiddleware } from "./middleware/authMiddleware.ts"
import { tokenBlacklistMiddleware } from "./middleware/tokenBlacklistMiddleware.ts"
import { cors } from "https://deno.land/x/oak_cors@1.0.0/mod.ts"
import emailTemplateRoutes from "./routes/emailTemplates.ts"
import loginEmailRoutes from "./routes/loginEmails.ts"
import { passwordResetRoutes } from './routes/passwordReset.ts'

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
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

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

app.use(tokenManagementRoutes.routes())
app.use(tokenManagementRoutes.allowedMethods())

app.use(passwordResetRoutes.routes())
app.use(passwordResetRoutes.allowedMethods())

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

// Start server
const port = parseInt(config.PORT || Deno.env.get('PORT') || '8000')
console.log(`Server running on port ${port}`)
await app.listen({ port })

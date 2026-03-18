/**
 * Test Server Entry Point
 * Starts the auth backend server with test database configuration
 */

import { Application, Router, Context } from "oak";
import { authRoutes } from "./routes/auth.ts";
import { tokenRoutes } from "./routes/tokenManagement.ts";
import { tokenRotationRoutes } from "./routes/tokenRotation.ts";
import { domainVerificationRoutes } from "./routes/domainVerification.ts";
import { authMiddleware } from "./middleware/authMiddleware.ts";
import { tokenBlacklistMiddleware } from "./middleware/tokenBlacklistMiddleware.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import emailTemplateRoutes from "./routes/emailTemplates.ts";
import { invitationRoutes } from "./routes/invitation.ts";
import loginEmailRoutes from "./routes/loginEmails.ts";
import { passwordResetRoutes } from "./routes/passwordReset.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// ✅ Load test environment variables
const env = await load({
  envPath: ".env.test",
  export: true,
  allowEmptyValues: true,
});

// ✅ Override database URL with test database
if (env.TEST_DATABASE_URL) {
  Deno.env.set("DATABASE_URL", env.TEST_DATABASE_URL);
  console.log("🧪 Test server using TEST_DATABASE_URL");
}

// ✅ Set test-specific environment
Deno.env.set("DENO_ENV", "test");

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// Enable CORS for All Origins
app.use(
  oakCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Error handling
app.use(async (ctx: Context, next: () => Promise<void>) => {
  try {
    await next();
  } catch (err) {
    console.error("Global error handler:", err);
    ctx.response.status = err.status || 500;
    ctx.response.body = { error: err.message || "Internal Server Error" };
    ctx.response.type = "json";
  }
});

// Middleware to check for blacklisted tokens
app.use(tokenBlacklistMiddleware);

app.use(passwordResetRoutes.routes());
app.use(passwordResetRoutes.allowedMethods());

// Authentication middleware (apply to specific routes)
app.use(authMiddleware);

// Routes
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

app.use(tokenRoutes.routes());
app.use(tokenRoutes.allowedMethods());

app.use(tokenRotationRoutes.routes());
app.use(tokenRotationRoutes.allowedMethods());

app.use(domainVerificationRoutes.routes());
app.use(domainVerificationRoutes.allowedMethods());

app.use(emailTemplateRoutes.routes());
app.use(emailTemplateRoutes.allowedMethods());

app.use(loginEmailRoutes.routes());
app.use(loginEmailRoutes.allowedMethods());

app.use(invitationRoutes.routes());
app.use(invitationRoutes.allowedMethods());

// Health check route
const router = new Router();
router.get("/health", (ctx) => {
  ctx.response.body = { status: "ok", version: "3.0-test" };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = parseInt(Deno.env.get("TEST_PORT") || "8001");
console.log(`🧪 Test server running on port ${port}`);
console.log(`🗄️  Using test database`);

await app.listen({ port });

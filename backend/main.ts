import { Application, Router, Context } from "oak";
import { authRoutes } from "./modules/auth/routes/auth.ts";
import { oauthRoutes } from "./modules/auth/routes/oauth.ts";
import { luxtrustRoutes } from "./modules/auth/routes/luxtrust.ts";
import { tokenRoutes } from "./modules/auth/routes/tokenManagement.ts";
import { tokenRotationRoutes } from "./modules/auth/routes/tokenRotation.ts";
import { domainVerificationRoutes } from "./modules/auth/routes/domainVerification.ts";
import { config } from "./shared/config/env.ts";
import { authMiddleware } from "./modules/auth/middleware/authMiddleware.ts";
import { activeContextMiddleware } from "./modules/auth/middleware/activeContextMiddleware.ts";
import { tokenBlacklistMiddleware } from "./shared/middleware/tokenBlacklistMiddleware.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import emailTemplateRoutes from "./shared/routes/emailTemplates.ts";
import { invitationRoutes } from "./modules/auth/routes/invitation.ts";
import loginEmailRoutes from "./shared/routes/loginEmails.ts";
import { passwordResetRoutes } from "./modules/auth/routes/passwordReset.ts";
import { tokenRotationService } from "./modules/auth/services/tokenRotationService.ts";
import webhookRouter from "./modules/payments/routes/webhooks.ts";
import subscriptionRouter from "./modules/payments/routes/subscriptions.ts";
import notificationRouter from "./modules/notifications/routes/notifications.ts";
import { createWebSocketHandler } from "./modules/notifications/websocket/notificationHandler.ts";
import { wearablesRoutes } from "./modules/wearables/routes/wearables.ts";
import {
  clinicalRoutes,
  servePlatformClinicalStats,
} from "./modules/clinical/routes/clinical.ts";
import { legacyClinicalAdminRoutes } from "./modules/admin/routes/legacyClinicalReview.ts";
import { superadminPlatformRoutes } from "./modules/admin/routes/superadminPlatform.ts";

const publicClinicalRouter = new Router();
publicClinicalRouter.get(
  "/api/clinical/platform-stats",
  servePlatformClinicalStats,
);

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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Mediloop-Tenant-Id",
      "X-Mediloop-Membership-Id",
      "X-Request-Id",
    ],
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

app.use(oauthRoutes.routes());
app.use(oauthRoutes.allowedMethods());

app.use(luxtrustRoutes.routes());
app.use(luxtrustRoutes.allowedMethods());

// Public clinical aggregate stats (no JWT) — must run before authMiddleware
app.use(publicClinicalRouter.routes());
app.use(publicClinicalRouter.allowedMethods());

// Authentication + Option C acting context (membership revalidation per request)
app.use(authMiddleware);
app.use(activeContextMiddleware);

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
  ctx.response.body = { status: "ok", version: "3.0" };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(webhookRouter.routes());
app.use(webhookRouter.allowedMethods());
app.use(subscriptionRouter.routes());
app.use(subscriptionRouter.allowedMethods());
app.use(notificationRouter.routes());
app.use(notificationRouter.allowedMethods());

app.use(wearablesRoutes.routes());
app.use(wearablesRoutes.allowedMethods());

app.use(clinicalRoutes.routes());
app.use(clinicalRoutes.allowedMethods());

app.use(legacyClinicalAdminRoutes.routes());
app.use(legacyClinicalAdminRoutes.allowedMethods());

app.use(superadminPlatformRoutes.routes());
app.use(superadminPlatformRoutes.allowedMethods());

// ✅ WebSocket endpoint using handler
const wsHandler = createWebSocketHandler();

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/ws/notifications") {
    await wsHandler(ctx);
  } else {
    await next();
  }
});

const port = Number(config.PORT || Deno.env.get("PORT") || "8000");

console.log(`🚀 Mediloop Backend running on http://localhost:${port}`);
console.log(
  `🔔 WebSocket server ready on ws://localhost:${port}/ws/notifications`,
);
console.log(`⏰ Automatic token rotation enabled (runs every 5 minutes)`);

// Start automatic token rotation cron job
console.log("[TokenRotation] Starting automatic token rotation service");
Deno.cron("Token Rotation", "*/5 * * * *", async () => {
  console.log("[TokenRotation] Running scheduled token rotation check");
  await tokenRotationService.processScheduledRotations();
});

// ✅ Start server (single listen call)
await app.listen({ port });

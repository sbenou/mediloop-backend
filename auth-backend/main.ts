
import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import emailTemplateRouter from "./routes/emailTemplates.ts";
import paymentsRouter from "./routes/payments.ts";
import orderEmailsRouter from "./routes/orderEmails.ts";
import loginEmailsRouter from "./routes/loginEmails.ts";
import healthCheckRouter from "./routes/healthCheck.ts";

const app = new Application();

// Global error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('❌ Server Error:', err);
    console.error('❌ Error stack:', err.stack);
    
    // Still set CORS headers even on error
    ctx.response.headers.set("Access-Control-Allow-Origin", "https://preview--mediloop.lovable.app");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Info, ApiKey");
    ctx.response.headers.set("Access-Control-Allow-Credentials", "false");
    
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'Internal Server Error',
      message: err.message,
      timestamp: new Date().toISOString()
    };
  }
});

// Global CORS middleware - must be first
app.use(async (ctx, next) => {
  const method = ctx.request.method;
  const url = ctx.request.url.pathname;
  const origin = ctx.request.headers.get('origin');
  
  console.log(`🌐 ${method} ${url} from origin: ${origin}`);
  console.log('📋 Request headers:', Object.fromEntries(ctx.request.headers.entries()));
  
  // Set CORS headers for all requests - do this FIRST
  try {
    console.log('🔧 Setting CORS headers...');
    ctx.response.headers.set("Access-Control-Allow-Origin", "https://preview--mediloop.lovable.app");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Client-Info, ApiKey");
    ctx.response.headers.set("Access-Control-Max-Age", "86400");
    ctx.response.headers.set("Access-Control-Allow-Credentials", "false");
    console.log('✅ CORS headers set successfully');
  } catch (headerError) {
    console.error('❌ Error setting CORS headers:', headerError);
  }
  
  // Handle preflight OPTIONS requests
  if (method === "OPTIONS") {
    console.log('✈️ Handling OPTIONS preflight request');
    console.log('📤 Response headers being sent:', Object.fromEntries(ctx.response.headers.entries()));
    
    try {
      ctx.response.status = 204;
      ctx.response.body = null;
      console.log('✅ OPTIONS response sent with status 204');
      return;
    } catch (optionsError) {
      console.error('❌ Error handling OPTIONS request:', optionsError);
      ctx.response.status = 500;
      ctx.response.body = { error: 'OPTIONS handling failed', details: optionsError.message };
      return;
    }
  }
  
  console.log('➡️ Proceeding to next middleware...');
  await next();
  console.log('⬅️ Response completed');
});

// Add all routers
app.use(healthCheckRouter.routes());
app.use(healthCheckRouter.allowedMethods());

app.use(emailTemplateRouter.routes());
app.use(emailTemplateRouter.allowedMethods());

app.use(paymentsRouter.routes());
app.use(paymentsRouter.allowedMethods());

app.use(orderEmailsRouter.routes());
app.use(orderEmailsRouter.allowedMethods());

app.use(loginEmailsRouter.routes());
app.use(loginEmailsRouter.allowedMethods());

// Start the server
const PORT = Deno.env.get("PORT") || "8000";
console.log(`🚀 Server starting on port ${PORT}`);
console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
console.log(`🌍 CORS configured for: https://preview--mediloop.lovable.app`);

try {
  await app.listen({ port: parseInt(PORT) });
} catch (serverError) {
  console.error('❌ Failed to start server:', serverError);
  console.error('❌ Server error stack:', serverError.stack);
}

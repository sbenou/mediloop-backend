
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

// Enhanced CORS middleware with extensive logging
app.use(async (ctx, next) => {
  const method = ctx.request.method;
  const url = ctx.request.url.pathname;
  const origin = ctx.request.headers.get('origin');
  
  console.log(`\n🔍 === INCOMING REQUEST DEBUG ===`);
  console.log(`📥 Method: ${method}`);
  console.log(`📥 URL: ${url}`);
  console.log(`📥 Origin: ${origin}`);
  console.log(`📥 User-Agent: ${ctx.request.headers.get('user-agent')}`);
  console.log(`📥 All Headers:`, Object.fromEntries(ctx.request.headers.entries()));
  
  // Set CORS headers for ALL requests
  console.log(`🔧 Setting CORS headers...`);
  
  try {
    // Set all CORS headers explicitly
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://preview--mediloop.lovable.app",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, ApiKey, Accept, Accept-Language, Accept-Encoding",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "false"
    };
    
    // Set each header individually with logging
    for (const [key, value] of Object.entries(corsHeaders)) {
      console.log(`🔧 Setting header: ${key} = ${value}`);
      ctx.response.headers.set(key, value);
    }
    
    console.log(`✅ All CORS headers set successfully`);
    console.log(`📤 Response headers after setting CORS:`, Object.fromEntries(ctx.response.headers.entries()));
    
  } catch (headerError) {
    console.error('❌ CRITICAL ERROR setting CORS headers:', headerError);
    console.error('❌ Header error stack:', headerError.stack);
  }
  
  // Handle preflight OPTIONS requests with extensive logging
  if (method === "OPTIONS") {
    console.log(`\n✈️ === HANDLING OPTIONS PREFLIGHT ===`);
    console.log(`✈️ Request headers for OPTIONS:`, Object.fromEntries(ctx.request.headers.entries()));
    console.log(`✈️ Access-Control-Request-Method: ${ctx.request.headers.get('Access-Control-Request-Method')}`);
    console.log(`✈️ Access-Control-Request-Headers: ${ctx.request.headers.get('Access-Control-Request-Headers')}`);
    
    try {
      // Explicitly verify all CORS headers are set
      const responseHeaders = Object.fromEntries(ctx.response.headers.entries());
      console.log(`✈️ Current response headers:`, responseHeaders);
      
      // Verify required CORS headers are present
      const requiredHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods', 
        'access-control-allow-headers'
      ];
      
      for (const header of requiredHeaders) {
        if (!responseHeaders[header]) {
          console.error(`❌ MISSING REQUIRED CORS HEADER: ${header}`);
        } else {
          console.log(`✅ CORS header present: ${header} = ${responseHeaders[header]}`);
        }
      }
      
      // Set status and body for OPTIONS
      ctx.response.status = 204;
      ctx.response.body = null;
      
      console.log(`✈️ OPTIONS response status set to: ${ctx.response.status}`);
      console.log(`✈️ Final response headers for OPTIONS:`, Object.fromEntries(ctx.response.headers.entries()));
      console.log(`✅ OPTIONS preflight response completed successfully`);
      console.log(`=== END OPTIONS PREFLIGHT ===\n`);
      
      return; // Important: return here to prevent further processing
      
    } catch (optionsError) {
      console.error('❌ CRITICAL ERROR in OPTIONS handling:', optionsError);
      console.error('❌ OPTIONS error stack:', optionsError.stack);
      
      // Still try to respond with error status
      ctx.response.status = 500;
      ctx.response.body = { 
        error: 'OPTIONS handling failed', 
        details: optionsError.message,
        timestamp: new Date().toISOString()
      };
      return;
    }
  }
  
  console.log(`➡️ Proceeding to route handlers for ${method} ${url}...`);
  
  try {
    await next();
    console.log(`⬅️ Route handler completed for ${method} ${url}`);
    console.log(`📤 Final response status: ${ctx.response.status}`);
    console.log(`📤 Final response headers:`, Object.fromEntries(ctx.response.headers.entries()));
  } catch (routeError) {
    console.error(`❌ Route handler error for ${method} ${url}:`, routeError);
    throw routeError; // Re-throw to be caught by global error handler
  }
  
  console.log(`=== END REQUEST DEBUG ===\n`);
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

// Start the server with error handling
const PORT = Deno.env.get("PORT") || "8000";
console.log(`\n🚀 === SERVER STARTUP ===`);
console.log(`🚀 Server starting on port ${PORT}`);
console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
console.log(`🌍 CORS configured for: https://preview--mediloop.lovable.app`);
console.log(`🔧 Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log(`🔧 Server time: ${new Date().toISOString()}`);
console.log(`=== END SERVER STARTUP ===\n`);

try {
  console.log(`🎯 Attempting to bind to port ${PORT}...`);
  await app.listen({ port: parseInt(PORT) });
} catch (serverError) {
  console.error('❌ CRITICAL: Failed to start server:', serverError);
  console.error('❌ Server startup error stack:', serverError.stack);
  console.error('❌ Port:', PORT);
  console.error('❌ Is port already in use? Try: lsof -ti:8000');
  Deno.exit(1);
}

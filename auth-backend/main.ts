import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import emailTemplateRouter from "./routes/emailTemplates.ts";
// Import other routers and services as needed

const app = new Application();

// Configure CORS
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// Use other routers here
// e.g. app.use(otherRouter.routes());
// app.use(otherRouter.allowedMethods());

// Add email template routes
app.use(emailTemplateRouter.routes());
app.use(emailTemplateRouter.allowedMethods());

// Start the server
const PORT = Deno.env.get("PORT") || "8000";
console.log(`Server running on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });

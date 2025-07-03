
import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import emailTemplateRouter from "./routes/emailTemplates.ts";
import paymentsRouter from "./routes/payments.ts";
import orderEmailsRouter from "./routes/orderEmails.ts";
import loginEmailsRouter from "./routes/loginEmails.ts";
import healthCheckRouter from "./routes/healthCheck.ts";

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
console.log(`Server running on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });

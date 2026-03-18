
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { emailTemplateService } from "../services/emailTemplateService.ts";
import { postgresService } from "../services/postgresService.ts";

const router = new Router();

// Send templated email endpoint
router.post("/api/send-templated-email", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { templateName, recipientEmail, variables } = body;

    console.log(`Sending templated email: ${templateName} to ${recipientEmail}`);

    const result = await emailTemplateService.sendTemplatedEmail(
      templateName,
      recipientEmail,
      variables
    );

    ctx.response.status = 200;
    ctx.response.body = { 
      success: result,
      message: result ? 'Email sent successfully' : 'Failed to send email'
    };
  } catch (error) {
    console.error('Error sending templated email:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Get email templates endpoint
router.get("/api/email-templates", async (ctx) => {
  try {
    const client = await postgresService.getClient();
    
    const result = await client.queryObject(
      `SELECT id, name, subject, template_key, is_active, created_at, updated_at 
       FROM email_templates 
       WHERE is_active = true 
       ORDER BY name`
    );
    
    postgresService.releaseClient(client);
    
    ctx.response.status = 200;
    ctx.response.body = result.rows;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

// Get email logs endpoint
router.get("/api/email-logs", async (ctx) => {
  try {
    const limit = ctx.request.url.searchParams.get('limit') || '50';
    
    const client = await postgresService.getClient();
    
    const result = await client.queryObject(
      `SELECT id, template_name, recipient_email, subject, status, variables, 
              sent_at, error_message, created_at 
       FROM email_logs 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [parseInt(limit)]
    );
    
    postgresService.releaseClient(client);
    
    ctx.response.status = 200;
    ctx.response.body = result.rows;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

export default router;

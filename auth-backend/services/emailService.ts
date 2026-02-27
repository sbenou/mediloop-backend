import { config } from "../config/env.ts";

export class EmailService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey =
      config.RESEND_API_KEY || Deno.env.get("RESEND_API_KEY") || "";
    if (!this.resendApiKey) {
      console.warn(
        "RESEND_API_KEY not configured - email sending will not work",
      );
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = `./templates/${templateName}.html`;
    try {
      const template = await Deno.readTextFile(templatePath);
      return template;
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  private replaceTemplateVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{ \\.${key} }}`, "g");
      result = result.replace(regex, value);
    }
    return result;
  }

  async sendEmailConfirmation(
    email: string,
    confirmationUrl: string,
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate("email-confirmation");
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: confirmationUrl,
      });

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mediloop <onboarding@resend.dev>",
          to: [email],
          subject: "Confirm Your Email Address",
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send confirmation email:", error);
        return false;
      }

      console.log("Email confirmation sent successfully to:", email);
      return true;
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate("password-reset");
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: resetUrl,
      });

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mediloop <onboarding@resend.dev>",
          to: [email],
          subject: "Reset Your Password",
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send password reset email:", error);
        return false;
      }

      console.log("Password reset email sent successfully to:", email);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }
  }

  async sendLoginCode(email: string, code: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate("login-code");
      const html = this.replaceTemplateVariables(template, {
        Token: code,
      });

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mediloop <onboarding@resend.dev>",
          to: [email],
          subject: "Your Login Code",
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send login code email:", error);
        return false;
      }

      console.log("Login code email sent successfully to:", email);
      return true;
    } catch (error) {
      console.error("Error sending login code email:", error);
      return false;
    }
  }

  async sendWelcomeEmail(
    email: string,
    userName: string,
    userRole: string,
    loginUrl: string,
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate("welcome");
      const html = this.replaceTemplateVariables(template, {
        UserName: userName,
        UserRole: userRole,
        LoginURL: loginUrl,
      });

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mediloop <onboarding@resend.dev>",
          to: [email],
          subject: "Welcome to Mediloop!",
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send welcome email:", error);
        return false;
      }

      console.log("Welcome email sent successfully to:", email);
      return true;
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return false;
    }
  }

  /**
   * ✅ NEW: Send invitation email to join an organization
   */
  async sendInvitationEmail(params: {
    email: string;
    tenantName: string;
    inviterName: string;
    role: string;
    token: string;
    expiresAt: Date;
  }): Promise<boolean> {
    try {
      const frontendUrl =
        Deno.env.get("FRONTEND_URL") || "http://localhost:3000";
      const acceptUrl = `${frontendUrl}/accept-invite?token=${params.token}`;

      // Calculate expiration in human-readable format
      const now = new Date();
      const hoursUntilExpiry = Math.round(
        (params.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60),
      );
      const expiryText =
        hoursUntilExpiry > 48
          ? `${Math.round(hoursUntilExpiry / 24)} days`
          : `${hoursUntilExpiry} hours`;

      // Try to load template, fallback to inline HTML if template doesn't exist
      let html: string;
      try {
        const template = await this.loadTemplate("invitation");
        html = this.replaceTemplateVariables(template, {
          TenantName: params.tenantName,
          InviterName: params.inviterName,
          Role: params.role,
          AcceptURL: acceptUrl,
          ExpiryText: expiryText,
        });
      } catch {
        // Fallback HTML if template doesn't exist
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { 
                display: inline-block; 
                background: #4F46E5; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
              }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .highlight { color: #4F46E5; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 You've Been Invited!</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Hello,</p>
                
                <p style="font-size: 16px;">
                  <span class="highlight">${params.inviterName}</span> has invited you to join 
                  <span class="highlight">${params.tenantName}</span> as a 
                  <span class="highlight">${params.role}</span>.
                </p>
                
                <p style="font-size: 16px;">Click the button below to accept this invitation:</p>
                
                <div style="text-align: center;">
                  <a href="${acceptUrl}" class="button">Accept Invitation</a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  ⏰ This invitation will expire in <strong>${expiryText}</strong>.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #666; font-size: 12px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Mediloop Healthcare Platform. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mediloop <onboarding@resend.dev>",
          to: [params.email],
          subject: `You've been invited to join ${params.tenantName}`,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send invitation email:", error);
        return false;
      }

      console.log("Invitation email sent successfully to:", params.email);
      return true;
    } catch (error) {
      console.error("Error sending invitation email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();

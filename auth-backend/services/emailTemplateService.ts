
import { postgresService } from "./postgresService.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

interface SendEmailParams {
  userId?: string;
  recipient: string;
  templateName: string;
  subject: string;
  htmlContent: string;
}

interface EmailAuditLog {
  id?: string;
  user_id?: string;
  recipient_email: string;
  template_name: string;
  sent_at?: Date;
  status: 'sent' | 'failed' | 'queued' | 'delivered' | 'bounced';
  error_message?: string;
  email_hash: string;
}

export class EmailTemplateService {
  private resendApiKey: string;

  constructor() {
    this.resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    if (!this.resendApiKey) {
      console.warn('RESEND_API_KEY not configured - email sending will not work');
    }
  }

  private async createEmailHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async logEmailAttempt(params: EmailAuditLog): Promise<void> {
    try {
      const client = await postgresService.getClient();
      
      await client.queryObject(
        `INSERT INTO email_audit_logs (user_id, recipient_email, template_name, status, error_message, email_hash) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          params.user_id || null,
          params.recipient_email,
          params.template_name,
          params.status,
          params.error_message || null,
          params.email_hash
        ]
      );
      
      postgresService.releaseClient(client);
      console.log(`Email audit log created: ${params.template_name} to ${params.recipient_email} - ${params.status}`);
    } catch (error) {
      console.error('Failed to log email attempt:', error);
      // Don't throw here - logging failure shouldn't break email sending
    }
  }

  private async sendEmailAndLog({
    userId,
    recipient,
    templateName,
    subject,
    htmlContent,
  }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    // Create SHA256 hash of the email content (no PHI stored)
    const emailHash = await this.createEmailHash(htmlContent);

    try {
      // Send email with Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Luxmed <onboarding@resend.dev>',
          to: [recipient],
          subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      // Log successful send
      await this.logEmailAttempt({
        user_id: userId,
        recipient_email: recipient,
        template_name: templateName,
        status: 'sent',
        email_hash: emailHash
      });

      console.log(`Email sent and logged: ${templateName} to ${recipient}`);
      return { success: true };

    } catch (error: any) {
      // Log failed send with error message
      await this.logEmailAttempt({
        user_id: userId,
        recipient_email: recipient,
        template_name: templateName,
        status: 'failed',
        error_message: error.message,
        email_hash: emailHash
      });

      console.error(`Failed to send email ${templateName} to ${recipient}:`, error);
      return { success: false, error: error.message };
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

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{ \.${key} }}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  async sendEmailConfirmation(email: string, confirmationUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('email-confirmation');
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: confirmationUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'email-confirmation',
        subject: 'Confirm Your Email Address',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  async sendPasswordReset(email: string, resetUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('password-reset');
      const html = this.replaceTemplateVariables(template, {
        ConfirmationURL: resetUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'password-reset',
        subject: 'Reset Your Password',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendLoginCode(email: string, code: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('login-code');
      const html = this.replaceTemplateVariables(template, {
        Token: code
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'login-code',
        subject: 'Your Login Code',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending login code email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, loginUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('welcome');
      const html = this.replaceTemplateVariables(template, {
        UserName: userName,
        UserRole: userRole,
        LoginURL: loginUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'welcome',
        subject: 'Welcome to Luxmed!',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // New template-based methods with audit logging
  async sendInviteUser(
    email: string, 
    inviterName: string, 
    invitationType: string, 
    workplaceName: string, 
    confirmationUrl: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('invite-user');
      const html = this.replaceTemplateVariables(template, {
        InviterName: inviterName,
        InvitationType: invitationType,
        WorkplaceName: workplaceName,
        ConfirmationURL: confirmationUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'invite-user',
        subject: `You're invited to join ${workplaceName}`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending invite user email:', error);
      return false;
    }
  }

  async sendConnectionInvitation(
    email: string,
    inviterName: string,
    inviterTitle: string,
    inviterRole: string,
    confirmationUrl: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('connection-invitation');
      const html = this.replaceTemplateVariables(template, {
        InviterName: inviterName,
        InviterTitle: inviterTitle,
        InviterRole: inviterRole,
        ConfirmationURL: confirmationUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'connection-invitation',
        subject: `Connection request from ${inviterName}`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending connection invitation email:', error);
      return false;
    }
  }

  async sendConnectionResponse(
    email: string,
    responderName: string,
    responderTitle: string,
    responderRole: string,
    dashboardUrl: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate('connection-response');
      const html = this.replaceTemplateVariables(template, {
        ResponderName: responderName,
        ResponderTitle: responderTitle,
        ResponderRole: responderRole,
        DashboardURL: dashboardUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'connection-response',
        subject: `${responderName} accepted your connection`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending connection response email:', error);
      return false;
    }
  }

  async sendChangeEmail(email: string, newEmail: string, confirmationUrl: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('change-email');
      const html = this.replaceTemplateVariables(template, {
        NewEmail: newEmail,
        ConfirmationURL: confirmationUrl
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'change-email',
        subject: 'Confirm Email Change',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending change email:', error);
      return false;
    }
  }

  async sendReauthentication(email: string, code: string, userId?: string): Promise<boolean> {
    try {
      const template = await this.loadTemplate('reauthentication');
      const html = this.replaceTemplateVariables(template, {
        Token: code
      });

      const result = await this.sendEmailAndLog({
        userId,
        recipient: email,
        templateName: 'reauthentication',
        subject: 'Reauthentication Required',
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error('Error sending reauthentication email:', error);
      return false;
    }
  }

  // Method to send templated emails with variables
  async sendTemplatedEmail(
    templateName: string,
    recipientEmail: string,
    variables: Record<string, any>,
    userId?: string
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate(templateName);
      const html = this.replaceTemplateVariables(template, variables);

      const result = await this.sendEmailAndLog({
        userId,
        recipient: recipientEmail,
        templateName,
        subject: variables.Subject || `Message from Luxmed`,
        htmlContent: html
      });

      return result.success;
    } catch (error) {
      console.error(`Error sending templated email ${templateName}:`, error);
      return false;
    }
  }

  // Method to retrieve audit logs (for compliance reporting)
  async getEmailAuditLogs(filters?: {
    userId?: string;
    templateName?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<EmailAuditLog[]> {
    try {
      const client = await postgresService.getClient();
      
      let query = 'SELECT * FROM email_audit_logs WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (filters?.userId) {
        query += ` AND user_id = $${++paramCount}`;
        params.push(filters.userId);
      }

      if (filters?.templateName) {
        query += ` AND template_name = $${++paramCount}`;
        params.push(filters.templateName);
      }

      if (filters?.status) {
        query += ` AND status = $${++paramCount}`;
        params.push(filters.status);
      }

      if (filters?.fromDate) {
        query += ` AND sent_at >= $${++paramCount}`;
        params.push(filters.fromDate.toISOString());
      }

      if (filters?.toDate) {
        query += ` AND sent_at <= $${++paramCount}`;
        params.push(filters.toDate.toISOString());
      }

      query += ' ORDER BY sent_at DESC';

      if (filters?.limit) {
        query += ` LIMIT $${++paramCount}`;
        params.push(filters.limit);
      }

      const result = await client.queryObject(query, params);
      postgresService.releaseClient(client);
      
      return result.rows as EmailAuditLog[];
    } catch (error) {
      console.error('Failed to retrieve email audit logs:', error);
      return [];
    }
  }
}

export const emailTemplateService = new EmailTemplateService();

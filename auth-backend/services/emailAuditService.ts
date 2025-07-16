
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

export class EmailAuditService {
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

  async sendEmailAndLog({
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

export const emailAuditService = new EmailAuditService();

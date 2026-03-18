/**
 * Email Audit Service
 *
 * Handles email audit log queries for compliance and reporting.
 * This service is READ-ONLY - logs are written by emailTemplateService during sending.
 *
 * Separation rationale:
 * - Single Responsibility: Audit queries vs email sending
 * - Security: Audit logs should be read-only in most contexts
 * - Compliance: Clear separation for auditing purposes
 * - Scalability: Audit logs grow much faster than templates
 */

import { postgresService } from "./postgresService.ts";

export interface EmailAuditLog {
  id?: string;
  user_id?: string;
  recipient_email: string;
  template_name: string;
  sent_at?: Date;
  status: "sent" | "failed" | "queued" | "delivered" | "bounced";
  error_message?: string;
  email_hash: string;
  created_at?: Date;
}

export interface EmailAuditFilters {
  userId?: string;
  templateName?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}

export interface EmailAuditStats {
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  queuedEmails: number;
  deliveredEmails: number;
  bouncedEmails: number;
  templateBreakdown: Record<string, number>;
  dailyStats: Record<
    string,
    {
      sent: number;
      failed: number;
      queued: number;
      delivered: number;
      bounced: number;
    }
  >;
}

export class EmailAuditService {
  /**
   * Get email audit logs with optional filters
   *
   * @param filters - Optional filters for querying logs
   * @returns Array of email audit logs
   */
  async getEmailAuditLogs(
    filters?: EmailAuditFilters,
  ): Promise<EmailAuditLog[]> {
    try {
      const client = await postgresService.getClient();

      let query = "SELECT * FROM email_audit_logs WHERE 1=1";
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

      query += " ORDER BY sent_at DESC";

      if (filters?.limit) {
        query += ` LIMIT $${++paramCount}`;
        params.push(filters.limit);
      }

      const result = await client.queryObject(query, params);
      postgresService.releaseClient(client);

      return result.rows as EmailAuditLog[];
    } catch (error) {
      console.error("Failed to retrieve email audit logs:", error);
      return [];
    }
  }

  /**
   * Get email audit statistics for a date range
   *
   * @param fromDate - Start date for statistics
   * @param toDate - End date for statistics
   * @returns Email statistics object
   */
  async getEmailAuditStats(
    fromDate: Date,
    toDate: Date,
  ): Promise<EmailAuditStats> {
    try {
      const logs = await this.getEmailAuditLogs({ fromDate, toDate });

      const stats: EmailAuditStats = {
        totalEmails: logs.length,
        sentEmails: logs.filter((log) => log.status === "sent").length,
        failedEmails: logs.filter((log) => log.status === "failed").length,
        queuedEmails: logs.filter((log) => log.status === "queued").length,
        deliveredEmails: logs.filter((log) => log.status === "delivered")
          .length,
        bouncedEmails: logs.filter((log) => log.status === "bounced").length,
        templateBreakdown: {},
        dailyStats: {},
      };

      // Calculate template breakdown
      logs.forEach((log) => {
        stats.templateBreakdown[log.template_name] =
          (stats.templateBreakdown[log.template_name] || 0) + 1;
      });

      // Calculate daily stats
      logs.forEach((log) => {
        if (!log.sent_at) return;

        const date = new Date(log.sent_at).toISOString().split("T")[0];
        if (!stats.dailyStats[date]) {
          stats.dailyStats[date] = {
            sent: 0,
            failed: 0,
            queued: 0,
            delivered: 0,
            bounced: 0,
          };
        }

        switch (log.status) {
          case "sent":
            stats.dailyStats[date].sent++;
            break;
          case "failed":
            stats.dailyStats[date].failed++;
            break;
          case "queued":
            stats.dailyStats[date].queued++;
            break;
          case "delivered":
            stats.dailyStats[date].delivered++;
            break;
          case "bounced":
            stats.dailyStats[date].bounced++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error("Failed to calculate email audit stats:", error);
      throw error;
    }
  }

  /**
   * Get email audit log by ID
   *
   * @param id - Audit log ID
   * @returns Email audit log or null if not found
   */
  async getEmailAuditLogById(id: string): Promise<EmailAuditLog | null> {
    try {
      const client = await postgresService.getClient();

      const result = await client.queryObject(
        "SELECT * FROM email_audit_logs WHERE id = $1",
        [id],
      );

      postgresService.releaseClient(client);

      return (result.rows[0] as EmailAuditLog) || null;
    } catch (error) {
      console.error("Failed to retrieve email audit log by ID:", error);
      return null;
    }
  }

  /**
   * Get email audit logs for a specific user
   *
   * @param userId - User ID
   * @param limit - Maximum number of logs to return
   * @returns Array of email audit logs
   */
  async getEmailAuditLogsByUser(
    userId: string,
    limit: number = 50,
  ): Promise<EmailAuditLog[]> {
    return await this.getEmailAuditLogs({ userId, limit });
  }

  /**
   * Get email audit logs for a specific template
   *
   * @param templateName - Template name
   * @param limit - Maximum number of logs to return
   * @returns Array of email audit logs
   */
  async getEmailAuditLogsByTemplate(
    templateName: string,
    limit: number = 50,
  ): Promise<EmailAuditLog[]> {
    return await this.getEmailAuditLogs({ templateName, limit });
  }

  /**
   * Get failed email audit logs
   *
   * @param fromDate - Optional start date
   * @param limit - Maximum number of logs to return
   * @returns Array of failed email audit logs
   */
  async getFailedEmailAuditLogs(
    fromDate?: Date,
    limit: number = 50,
  ): Promise<EmailAuditLog[]> {
    return await this.getEmailAuditLogs({
      status: "failed",
      fromDate,
      limit,
    });
  }

  /**
   * Get email success rate for a date range
   *
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Success rate as a percentage (0-100)
   */
  async getEmailSuccessRate(fromDate: Date, toDate: Date): Promise<number> {
    try {
      const logs = await this.getEmailAuditLogs({ fromDate, toDate });

      if (logs.length === 0) return 0;

      const successCount = logs.filter(
        (log) => log.status === "sent" || log.status === "delivered",
      ).length;

      return (successCount / logs.length) * 100;
    } catch (error) {
      console.error("Failed to calculate email success rate:", error);
      return 0;
    }
  }

  /**
   * Get total email count for a user
   *
   * @param userId - User ID
   * @returns Total number of emails sent to the user
   */
  async getTotalEmailCountByUser(userId: string): Promise<number> {
    try {
      const client = await postgresService.getClient();

      const result = await client.queryObject(
        "SELECT COUNT(*) as count FROM email_audit_logs WHERE user_id = $1",
        [userId],
      );

      postgresService.releaseClient(client);

      return Number((result.rows[0] as any).count) || 0;
    } catch (error) {
      console.error("Failed to get total email count by user:", error);
      return 0;
    }
  }

  /**
   * Check if an email was recently sent (duplicate detection)
   *
   * @param recipientEmail - Recipient email address
   * @param templateName - Template name
   * @param withinMinutes - Time window in minutes
   * @returns True if a similar email was sent within the time window
   */
  async wasEmailRecentlySent(
    recipientEmail: string,
    templateName: string,
    withinMinutes: number = 5,
  ): Promise<boolean> {
    try {
      const client = await postgresService.getClient();

      const fromDate = new Date(Date.now() - withinMinutes * 60 * 1000);

      const result = await client.queryObject(
        `SELECT COUNT(*) as count 
         FROM email_audit_logs 
         WHERE recipient_email = $1 
           AND template_name = $2 
           AND sent_at >= $3
           AND status IN ('sent', 'delivered')`,
        [recipientEmail, templateName, fromDate.toISOString()],
      );

      postgresService.releaseClient(client);

      const count = Number((result.rows[0] as any).count) || 0;
      return count > 0;
    } catch (error) {
      console.error("Failed to check if email was recently sent:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailAuditService = new EmailAuditService();

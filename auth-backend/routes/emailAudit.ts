
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { emailAuditService } from "../services/emailAuditService.ts";

const router = new Router();

// Get email audit logs (for compliance reporting)
router.get("/api/email-audit-logs", async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const filters = {
      userId: url.searchParams.get('userId') || undefined,
      templateName: url.searchParams.get('templateName') || undefined,
      status: url.searchParams.get('status') || undefined,
      fromDate: url.searchParams.get('fromDate') ? new Date(url.searchParams.get('fromDate')!) : undefined,
      toDate: url.searchParams.get('toDate') ? new Date(url.searchParams.get('toDate')!) : undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50
    };

    const logs = await emailAuditService.getEmailAuditLogs(filters);
    
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: logs,
      count: logs.length
    };
  } catch (error) {
    console.error('Error retrieving email audit logs:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false,
      error: error.message 
    };
  }
});

// Get email statistics (for compliance dashboard)
router.get("/api/email-audit-stats", async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const fromDate = url.searchParams.get('fromDate') ? new Date(url.searchParams.get('fromDate')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const toDate = url.searchParams.get('toDate') ? new Date(url.searchParams.get('toDate')!) : new Date();

    const allLogs = await emailAuditService.getEmailAuditLogs({ fromDate, toDate });
    
    const stats = {
      totalEmails: allLogs.length,
      sentEmails: allLogs.filter(log => log.status === 'sent').length,
      failedEmails: allLogs.filter(log => log.status === 'failed').length,
      templateBreakdown: {} as Record<string, number>,
      dailyStats: {} as Record<string, { sent: number; failed: number }>
    };

    // Calculate template breakdown
    allLogs.forEach(log => {
      stats.templateBreakdown[log.template_name] = (stats.templateBreakdown[log.template_name] || 0) + 1;
    });

    // Calculate daily stats
    allLogs.forEach(log => {
      const date = new Date(log.sent_at!).toISOString().split('T')[0];
      if (!stats.dailyStats[date]) {
        stats.dailyStats[date] = { sent: 0, failed: 0 };
      }
      if (log.status === 'sent') {
        stats.dailyStats[date].sent++;
      } else if (log.status === 'failed') {
        stats.dailyStats[date].failed++;
      }
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats,
      period: { fromDate, toDate }
    };
  } catch (error) {
    console.error('Error retrieving email audit stats:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false,
      error: error.message 
    };
  }
});

export default router;

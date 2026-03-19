/**
 * Email Audit Routes
 *
 * Provides endpoints for querying email audit logs and statistics.
 * Used for compliance reporting and monitoring.
 *
 * Security: All endpoints require authentication and admin/compliance privileges
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { emailAuditService } from "../services/emailAuditService.ts";
import { authMiddleware } from "../../modules/auth/middleware/authMiddleware.ts";
import { requireCompliance } from "../../modules/auth/middleware/roleMiddleware.ts";

const router = new Router();

// Apply authentication and role checking to all audit endpoints
// Only authenticated users with admin or compliance roles can access audit logs
const auditAuthMiddlewares = [authMiddleware, requireCompliance] as const;

/**
 * GET /api/email-audit-logs
 *
 * Retrieve email audit logs with optional filters
 *
 * Query Parameters:
 * - userId: Filter by user ID
 * - templateName: Filter by template name
 * - status: Filter by status (sent, failed, queued, delivered, bounced)
 * - fromDate: Filter from date (ISO 8601)
 * - toDate: Filter to date (ISO 8601)
 * - limit: Maximum number of results (default: 50)
 */
router.get("/api/email-audit-logs", ...auditAuthMiddlewares, async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const filters = {
      userId: url.searchParams.get("userId") || undefined,
      templateName: url.searchParams.get("templateName") || undefined,
      status: url.searchParams.get("status") || undefined,
      fromDate: url.searchParams.get("fromDate")
        ? new Date(url.searchParams.get("fromDate")!)
        : undefined,
      toDate: url.searchParams.get("toDate")
        ? new Date(url.searchParams.get("toDate")!)
        : undefined,
      limit: url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!)
        : 50,
    };

    const logs = await emailAuditService.getEmailAuditLogs(filters);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: logs,
      count: logs.length,
    };
  } catch (error) {
    console.error("Error retrieving email audit logs:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error.message,
    };
  }
});

/**
 * GET /api/email-audit-stats
 *
 * Get email statistics for a date range
 *
 * Query Parameters:
 * - fromDate: Start date (ISO 8601) - defaults to 30 days ago
 * - toDate: End date (ISO 8601) - defaults to now
 */
router.get("/api/email-audit-stats", ...auditAuthMiddlewares, async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const fromDate = url.searchParams.get("fromDate")
      ? new Date(url.searchParams.get("fromDate")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const toDate = url.searchParams.get("toDate")
      ? new Date(url.searchParams.get("toDate")!)
      : new Date();

    const stats = await emailAuditService.getEmailAuditStats(fromDate, toDate);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats,
      period: { fromDate, toDate },
    };
  } catch (error) {
    console.error("Error retrieving email audit stats:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error.message,
    };
  }
});

/**
 * GET /api/email-audit-logs/:id
 *
 * Get a specific email audit log by ID
 */
router.get(
  "/api/email-audit-logs/:id",
  ...auditAuthMiddlewares,
  async (ctx) => {
    try {
      const id = ctx.params.id;

      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Log ID is required",
        };
        return;
      }

      const log = await emailAuditService.getEmailAuditLogById(id);

      if (!log) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Email audit log not found",
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: log,
      };
    } catch (error) {
      console.error("Error retrieving email audit log by ID:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * GET /api/email-audit-logs/user/:userId
 *
 * Get email audit logs for a specific user
 */
router.get(
  "/api/email-audit-logs/user/:userId",
  ...auditAuthMiddlewares,
  async (ctx) => {
    try {
      const userId = ctx.params.userId;

      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "User ID is required",
        };
        return;
      }

      const url = new URL(ctx.request.url);
      const limit = url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!)
        : 50;

      const logs = await emailAuditService.getEmailAuditLogsByUser(
        userId,
        limit,
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: logs,
        count: logs.length,
      };
    } catch (error) {
      console.error("Error retrieving email audit logs by user:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * GET /api/email-audit-logs/template/:templateName
 *
 * Get email audit logs for a specific template
 */
router.get(
  "/api/email-audit-logs/template/:templateName",
  ...auditAuthMiddlewares,
  async (ctx) => {
    try {
      const templateName = ctx.params.templateName;

      if (!templateName) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "Template name is required",
        };
        return;
      }

      const url = new URL(ctx.request.url);
      const limit = url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!)
        : 50;

      const logs = await emailAuditService.getEmailAuditLogsByTemplate(
        templateName,
        limit,
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: logs,
        count: logs.length,
      };
    } catch (error) {
      console.error("Error retrieving email audit logs by template:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * GET /api/email-audit-logs/failed
 *
 * Get failed email audit logs
 */
router.get(
  "/api/email-audit-logs/failed",
  ...auditAuthMiddlewares,
  async (ctx) => {
    try {
      const url = new URL(ctx.request.url);
      const fromDate = url.searchParams.get("fromDate")
        ? new Date(url.searchParams.get("fromDate")!)
        : undefined;
      const limit = url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!)
        : 50;

      const logs = await emailAuditService.getFailedEmailAuditLogs(
        fromDate,
        limit,
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: logs,
        count: logs.length,
      };
    } catch (error) {
      console.error("Error retrieving failed email audit logs:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * GET /api/email-audit-success-rate
 *
 * Get email success rate for a date range
 *
 * Query Parameters:
 * - fromDate: Start date (ISO 8601) - defaults to 30 days ago
 * - toDate: End date (ISO 8601) - defaults to now
 */
router.get(
  "/api/email-audit-success-rate",
  ...auditAuthMiddlewares,
  async (ctx) => {
    try {
      const url = new URL(ctx.request.url);
      const fromDate = url.searchParams.get("fromDate")
        ? new Date(url.searchParams.get("fromDate")!)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = url.searchParams.get("toDate")
        ? new Date(url.searchParams.get("toDate")!)
        : new Date();

      const successRate = await emailAuditService.getEmailSuccessRate(
        fromDate,
        toDate,
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          successRate: successRate.toFixed(2),
          period: { fromDate, toDate },
        },
      };
    } catch (error) {
      console.error("Error calculating email success rate:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: error.message,
      };
    }
  },
);

/**
 * GET /api/email-audit-count/user/:userId
 *
 * Get total email count for a specific user
 */
router.get(
  "/api/email-audit-count/user/:userId",
  ...auditAuthMiddlewares,
  async (ctx) => {
    try {
      const userId = ctx.params.userId;

      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "User ID is required",
        };
        return;
      }

      const count = await emailAuditService.getTotalEmailCountByUser(userId);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          userId,
          totalEmails: count,
        },
      };
    } catch (error) {
      console.error("Error getting total email count by user:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: error.message,
      };
    }
  },
);

export default router;

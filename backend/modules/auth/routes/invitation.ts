import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "../../../shared/config/env.ts";
import { invitationService } from "../services/invitationService.ts";
import { enhancedJwtService } from "../services/enhancedJwtService.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

/**
 * ✅ UPDATED INVITATION ROUTES
 *
 * This version works with your CURRENT database architecture:
 * - auth.users (not public.users)
 * - public.tenants (not public.pharmacies)
 * - public.user_tenants (not doctor_workplaces/pharmacist_workplaces)
 */

const invitationRoutes = new Router();

/**
 * POST /api/invitations/create
 * Create a new invitation
 *
 * @deprecated Use /api/invitations/send instead (includes user existence check)
 *
 * Body: {
 *   email: string,
 *   tenantId: string,
 *   role: string,
 *   message?: string,
 *   expiresInHours?: number
 * }
 */
invitationRoutes.post("/api/invitations/create", async (ctx) => {
  try {
    // 1. Authenticate user
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const verification = await enhancedJwtService.verifyToken(token);

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    // 2. Get request body
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, tenantId, role, message, expiresInHours } = body;

    // 3. Validate required fields
    if (!email || !tenantId || !role) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Missing required fields: email, tenantId, role",
      };
      return;
    }

    // 4. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid email format" };
      return;
    }

    console.log("Creating invitation:", { email, tenantId, role });

    // 5. Create invitation
    const invitation = await invitationService.createInvitation({
      email,
      invitedByUserId: verification.payload.sub,
      tenantId,
      role,
      message,
      expiresInHours,
    });

    console.log("Invitation created successfully:", invitation.id);

    // 6. Return success (in production, send email here)
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        invitationLink: `${config.PUBLIC_FRONTEND_URL}/accept-invite?token=${invitation.token}`,
      },
      message:
        "Invitation created successfully. Email would be sent in production.",
    };
  } catch (error) {
    console.error("Create invitation error:", error);
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

/**
 * POST /api/invitations/send
 * Send invitation with user existence check
 *
 * Body: {
 *   email: string,
 *   tenantId: string,
 *   role: string,
 *   message?: string
 * }
 */
invitationRoutes.post("/api/invitations/send", async (ctx) => {
  try {
    // 1. Authenticate user
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const verification = await enhancedJwtService.verifyToken(token);

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    // 2. Get request body
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, tenantId, role, message } = body;

    // 3. Validate required fields
    if (!email || !tenantId || !role) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Missing required fields: email, tenantId, role",
      };
      return;
    }

    // 4. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid email format" };
      return;
    }

    console.log("Sending invitation:", { email, tenantId, role });

    // 5. Check if user exists in Mediloop
    const userExists = await invitationService.checkUserExists(email);
    console.log(`User ${email} exists in Mediloop:`, userExists);

    // 6. Create invitation
    const invitation = await invitationService.createInvitation({
      email,
      invitedByUserId: verification.payload.sub,
      tenantId,
      role,
      message,
    });

    // 🆕 Handle case where user is already a member
    if (invitation === null) {
      ctx.response.status = 409; // Conflict
      ctx.response.body = {
        success: false,
        userExists: true,
        isAlreadyMember: true,
        message: "User is already a member of this organization",
      };
      return;
    }

    console.log("Invitation created successfully:", invitation.id);

    // 7. Return success with user existence flag
    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      userExists,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
      },
      message: userExists
        ? "Invitation sent to existing Mediloop user"
        : "Invitation email sent to new user",
    };
  } catch (error) {
    console.error("Send invitation error:", error);
    ctx.response.status = 500; // Changed from 400 to 500 for unexpected errors
    ctx.response.body = {
      error: "An unexpected error occurred while processing the invitation",
    };
  }
});

/**
 * GET /api/invitations/validate/:token
 * Validate an invitation token and get details
 */
invitationRoutes.get("/api/invitations/validate/:token", async (ctx) => {
  try {
    const token = ctx.params.token;

    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Token is required" };
      return;
    }

    console.log("Validating invitation token");

    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Invitation not found" };
      return;
    }

    console.log("Invitation validated:", invitation.email);

    // Return invitation details
    ctx.response.body = {
      valid: invitation.status === "pending",
      invitation: {
        email: invitation.email,
        tenantName: invitation.tenant_name,
        role: invitation.role,
        invitedBy: invitation.invited_by_name,
        expiresAt: invitation.expires_at,
        status: invitation.status,
        message: invitation.message,
      },
    };
  } catch (error) {
    console.error("Validate invitation error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to validate invitation" };
  }
});

/**
 * POST /api/invitations/accept
 * Accept invitation and create new user account (NO AUTH REQUIRED)
 *
 * Body: {
 *   token: string,
 *   password: string,
 *   fullName: string
 * }
 */
invitationRoutes.post("/api/invitations/accept", async (ctx) => {
  try {
    // 1. Get request body
    const body = await ctx.request.body({ type: "json" }).value;
    const { token, password, fullName } = body;

    // 2. Validate required fields
    if (!token || !password || !fullName) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Missing required fields: token, password, fullName",
      };
      return;
    }

    // 3. Validate password length
    if (password.length < 8) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Password must be at least 8 characters long",
      };
      return;
    }

    console.log(
      "Accepting invitation with token:",
      token.substring(0, 10) + "...",
    );

    // 4. Get invitation details
    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Invitation not found" };
      return;
    }

    if (invitation.status !== "pending") {
      ctx.response.status = 400;
      ctx.response.body = { error: `Invitation is ${invitation.status}` };
      return;
    }

    if (new Date(invitation.expires_at) < new Date()) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invitation has expired" };
      return;
    }

    console.log("Invitation validated for email:", invitation.email);

    // 6. Check if user already exists
    const existingUserResult = await postgresService.query(
      "SELECT id FROM auth.users WHERE email = $1",
      [invitation.email],
    );

    let userId: string;

    if (existingUserResult.rows.length > 0) {
      // User exists - just accept the invitation
      userId = existingUserResult.rows[0].id;
      console.log("User already exists:", userId);

      await invitationService.acceptInvitation({ token, userId });
    } else {
      // New user - create account
      console.log("Creating new user account...");

      // Hash password
      const passwordHash = await bcrypt.hash(password);

      const schemaCheck = await postgresService.query(
        `SELECT current_schema(), current_database()`,
      );
      console.log("🔍 Current schema:", schemaCheck.rows[0]);

      // Debug: Check if role exists in public schema
      const roleCheck = await postgresService.query(
        `SELECT id, name FROM public.roles WHERE name = $1`,
        ["nurse"],
      );
      console.log("🔍 Role check in public.roles:", roleCheck.rows);

      const normalizedRole = invitation.role.toLowerCase();

      const roleResult = await postgresService.query(
        `SELECT id FROM public.roles WHERE LOWER(name) = LOWER($1)`,
        [normalizedRole],
      );

      if (roleResult.rows.length === 0) {
        throw new Error(`Role '${normalizedRole}' not found in roles table`);
      }

      const roleId = roleResult.rows[0].id;

      // Create user
      const userResult = await postgresService.query(
        `INSERT INTO auth.users (email, password_hash, full_name, role, role_id, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [invitation.email, passwordHash, fullName, normalizedRole, roleId],
      );

      userId = userResult.rows[0].id;
      console.log("New user created:", userId);

      // Auto-accept all pending invitations for this email
      const acceptedCount =
        await invitationService.autoAcceptPendingInvitations(
          invitation.email,
          userId,
        );

      console.log(`Auto-accepted ${acceptedCount} invitation(s)`);
    }

    // 7. Generate JWT token
    const forwarded = ctx.request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : ctx.request.ip || "unknown";
    const userAgent = ctx.request.headers.get("user-agent") || "unknown";

    const tokenData = await enhancedJwtService.createToken(
      userId,
      invitation.email,
      invitation.role,
      ipAddress,
      userAgent,
    );

    console.log("Invitation accepted successfully");

    // 8. Return success with tokens
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Invitation accepted successfully",
      user: {
        id: userId,
        email: invitation.email,
        fullName: fullName,
      },
      token: tokenData.token,
      sessionId: tokenData.sessionId,
      expiresAt: tokenData.expiresAt,
    };
  } catch (error) {
    console.error("Accept invitation error:", error);
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

/**
 * GET /api/invitations/pending/tenant/:tenantId
 * Get all pending invitations for a tenant (requires authentication)
 */
invitationRoutes.get(
  "/api/invitations/pending/tenant/:tenantId",
  async (ctx) => {
    try {
      // 1. Authenticate user
      const authHeader = ctx.request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Authorization header required" };
        return;
      }

      const token = authHeader.substring(7);
      const verification = await enhancedJwtService.verifyToken(token);

      if (!verification.valid) {
        ctx.response.status = 401;
        ctx.response.body = { error: verification.error || "Invalid token" };
        return;
      }

      // 2. Get tenant ID from params
      const tenantId = ctx.params.tenantId;

      if (!tenantId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Tenant ID is required" };
        return;
      }

      console.log("Fetching pending invitations for tenant:", tenantId);

      // 3. Get pending invitations
      const invitations =
        await invitationService.getPendingInvitationsForTenant(tenantId);

      console.log(`Found ${invitations.length} pending invitation(s)`);

      // 4. Return invitations
      ctx.response.body = {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          invitedBy: inv.invited_by_name,
          invitedAt: inv.invited_at,
          expiresAt: inv.expires_at,
          message: inv.message,
        })),
      };
    } catch (error) {
      console.error("Get pending invitations error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to fetch pending invitations" };
    }
  },
);

/**
 * GET /api/invitations/pending/my-invites
 * Get all pending invitations for the authenticated user's email
 */
invitationRoutes.get("/api/invitations/pending/my-invites", async (ctx) => {
  try {
    // 1. Authenticate user
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const verification = await enhancedJwtService.verifyToken(token);

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    // 2. Get user's email from token
    const userEmail = verification.payload.email;

    console.log("Fetching pending invitations for email:", userEmail);

    // 3. Get pending invitations for this email
    const invitations =
      await invitationService.getPendingInvitationsForEmail(userEmail);

    console.log(`Found ${invitations.length} pending invitation(s)`);

    // 4. Return invitations
    ctx.response.body = {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        tenantName: inv.tenant_name,
        role: inv.role,
        invitedBy: inv.invited_by_name,
        invitedAt: inv.invited_at,
        expiresAt: inv.expires_at,
        message: inv.message,
        token: inv.token, // Include token so they can accept it
      })),
    };
  } catch (error) {
    console.error("Get my invitations error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch your invitations" };
  }
});

/**
 * DELETE /api/invitations/:invitationId
 * Cancel a pending invitation
 */
invitationRoutes.delete("/api/invitations/:invitationId", async (ctx) => {
  try {
    // 1. Authenticate user
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const verification = await enhancedJwtService.verifyToken(token);

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    // 2. Get invitation ID
    const invitationId = ctx.params.invitationId;

    if (!invitationId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invitation ID is required" };
      return;
    }

    console.log("Cancelling invitation:", invitationId);

    // 3. Cancel invitation
    await invitationService.cancelInvitation(
      invitationId,
      verification.payload.sub,
    );

    console.log("Invitation cancelled successfully");

    // 4. Return success
    ctx.response.body = {
      success: true,
      message: "Invitation cancelled successfully",
    };
  } catch (error) {
    console.error("Cancel invitation error:", error);
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export { invitationRoutes };

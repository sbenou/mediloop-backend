import { postgresService } from "./postgresService.ts";
import { PostgresService } from "./postgresService.ts";
import { emailService } from "./emailService.ts";

/**
 * ✅ UPDATED INVITATION SERVICE
 *
 * This version works with your CURRENT database architecture:
 * - auth.users (not public.users)
 * - public.tenants (not public.pharmacies)
 * - public.user_tenants (not doctor_workplaces/pharmacist_workplaces)
 * - public.invitations (new table)
 *
 * ✅ Integrated with Resend email service
 */

export interface Invitation {
  id: string;
  email: string;
  invited_by_user_id: string;
  tenant_id: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  token: string;
  invited_at: Date;
  expires_at: Date;
  accepted_at?: Date;
  accepted_by_user_id?: string;
  message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInvitationParams {
  email: string;
  invitedByUserId: string;
  tenantId: string;
  role: string;
  message?: string;
  expiresInHours?: number; // Default: 72 hours (3 days)
}

export interface AcceptInvitationParams {
  token: string;
  userId: string;
}

export class InvitationService {
  private postgres: PostgresService;

  constructor(postgresService: PostgresService) {
    this.postgres = postgresService;
  }

  /**
   * Create a new invitation
   */
  async createInvitation(params: CreateInvitationParams): Promise<Invitation> {
    console.log("=== CREATE INVITATION START ===");
    console.log("Invitation params:", {
      email: params.email,
      tenantId: params.tenantId,
      role: params.role,
      invitedBy: params.invitedByUserId,
    });

    try {
      // 1. Validate tenant exists
      const tenantResult = await this.postgres.query(
        "SELECT id, name FROM public.tenants WHERE id = $1 AND is_active = true",
        [params.tenantId],
      );

      if (tenantResult.rows.length === 0) {
        throw new Error("Tenant not found or inactive");
      }

      const tenant = tenantResult.rows[0];
      console.log("✓ Tenant validated:", tenant.name);

      // 2. Validate inviter has permission (must be member of tenant)
      const inviterResult = await this.postgres.query(
        `SELECT ut.role, u.email, u.full_name 
         FROM public.user_tenants ut
         JOIN auth.users u ON u.id = ut.user_id
         WHERE ut.user_id = $1 AND ut.tenant_id = $2 AND ut.is_active = true`,
        [params.invitedByUserId, params.tenantId],
      );

      if (inviterResult.rows.length === 0) {
        throw new Error(
          "You do not have permission to invite users to this organization",
        );
      }

      const inviter = inviterResult.rows[0];
      console.log("✓ Inviter validated:", inviter.email);

      // 3. Check if user is already a member
      const existingMemberResult = await this.postgres.query(
        `SELECT ut.id, u.email 
         FROM public.user_tenants ut
         JOIN auth.users u ON u.id = ut.user_id
         WHERE u.email = $1 AND ut.tenant_id = $2`,
        [params.email, params.tenantId],
      );

      if (existingMemberResult.rows.length > 0) {
        throw new Error("User is already a member of this organization");
      }

      console.log("✓ User is not already a member");

      // 4. Check for existing pending invitation
      const existingInviteResult = await this.postgres.query(
        `SELECT id, status, expires_at 
         FROM public.invitations 
         WHERE email = $1 AND tenant_id = $2 AND status = 'pending'`,
        [params.email, params.tenantId],
      );

      if (existingInviteResult.rows.length > 0) {
        const existing = existingInviteResult.rows[0];
        if (new Date(existing.expires_at) > new Date()) {
          throw new Error("A pending invitation already exists for this email");
        }
        // Expire the old invitation
        await this.postgres.query(
          "UPDATE public.invitations SET status = 'expired' WHERE id = $1",
          [existing.id],
        );
        console.log("✓ Expired old invitation");
      }

      // 5. Generate secure token
      const token = this.generateInvitationToken();
      console.log("✓ Generated invitation token");

      // 6. Calculate expiration
      const expiresInHours = params.expiresInHours || 72; // Default 3 days
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // 7. Create invitation
      const result = await this.postgres.query(
        `INSERT INTO public.invitations 
         (email, invited_by_user_id, tenant_id, role, token, expires_at, message, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [
          params.email,
          params.invitedByUserId,
          params.tenantId,
          params.role,
          token,
          expiresAt,
          params.message || null,
        ],
      );

      const invitation = result.rows[0];

      console.log("=== CREATE INVITATION SUCCESS ===");
      console.log("Invitation created:", {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expires_at,
      });

      // Send email notification
      await emailService.sendInvitationEmail({
        email: invitation.email,
        tenantName: tenant.name,
        inviterName: inviter.full_name,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expires_at,
      });

      return invitation;
    } catch (error) {
      console.error("=== CREATE INVITATION FAILED ===");
      console.error("Error:", error.message);
      throw error;
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const result = await this.postgres.query(
        `SELECT i.*, 
                t.name as tenant_name,
                u.full_name as invited_by_name,
                u.email as invited_by_email
         FROM public.invitations i
         JOIN public.tenants t ON t.id = i.tenant_id
         JOIN auth.users u ON u.id = i.invited_by_user_id
         WHERE i.token = $1`,
        [token],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const invitation = result.rows[0];

      // Check if expired
      if (
        invitation.status === "pending" &&
        new Date(invitation.expires_at) < new Date()
      ) {
        // Auto-expire
        await this.postgres.query(
          "UPDATE public.invitations SET status = 'expired' WHERE id = $1",
          [invitation.id],
        );
        invitation.status = "expired";
      }

      return invitation;
    } catch (error) {
      console.error("Error fetching invitation:", error);
      throw error;
    }
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(params: AcceptInvitationParams): Promise<void> {
    console.log("=== ACCEPT INVITATION START ===");
    console.log("Accepting invitation:", {
      token: params.token.substring(0, 10) + "...",
      userId: params.userId,
    });

    const client = await this.postgres.getClient();

    try {
      await client.queryArray("BEGIN");

      // 1. Get and validate invitation
      const inviteResult = await client.queryObject<Invitation>(
        `SELECT * FROM public.invitations 
         WHERE token = $1 
         FOR UPDATE`,
        [params.token],
      );

      if (inviteResult.rows.length === 0) {
        throw new Error("Invitation not found");
      }

      const invitation = inviteResult.rows[0];

      // 2. Validate invitation status
      if (invitation.status !== "pending") {
        throw new Error(`Invitation is ${invitation.status}`);
      }

      // 3. Check expiration
      if (new Date(invitation.expires_at) < new Date()) {
        await client.queryArray(
          "UPDATE public.invitations SET status = 'expired' WHERE id = $1",
          [invitation.id],
        );
        throw new Error("Invitation has expired");
      }

      // 4. Verify user email matches invitation
      const userResult = await client.queryObject(
        "SELECT email FROM auth.users WHERE id = $1",
        [params.userId],
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = userResult.rows[0];
      if (user.email !== invitation.email) {
        throw new Error("User email does not match invitation email");
      }

      console.log("✓ Invitation validated");

      // 5. Check if user is already a member
      const existingMemberResult = await client.queryObject(
        `SELECT id FROM public.user_tenants 
         WHERE user_id = $1 AND tenant_id = $2`,
        [params.userId, invitation.tenant_id],
      );

      if (existingMemberResult.rows.length > 0) {
        // Already a member, just mark invitation as accepted
        await client.queryArray(
          `UPDATE public.invitations 
           SET status = 'accepted', accepted_at = NOW(), accepted_by_user_id = $1 
           WHERE id = $2`,
          [params.userId, invitation.id],
        );
        await client.queryArray("COMMIT");
        console.log("✓ User already a member, invitation marked as accepted");
        return;
      }

      // 6. Add user to tenant
      await client.queryArray(
        `INSERT INTO public.user_tenants 
         (user_id, tenant_id, role, is_active, is_primary)
         VALUES ($1, $2, $3, true, false)`,
        [params.userId, invitation.tenant_id, invitation.role],
      );

      console.log("✓ User added to tenant");

      // 7. Mark invitation as accepted
      await client.queryArray(
        `UPDATE public.invitations 
         SET status = 'accepted', accepted_at = NOW(), accepted_by_user_id = $1
         WHERE id = $2`,
        [params.userId, invitation.id],
      );

      console.log("✓ Invitation marked as accepted");

      await client.queryArray("COMMIT");

      console.log("=== ACCEPT INVITATION SUCCESS ===");
    } catch (error) {
      await client.queryArray("ROLLBACK");
      console.error("=== ACCEPT INVITATION FAILED ===");
      console.error("Error:", error.message);
      throw error;
    } finally {
      this.postgres.releaseClient(client);
    }
  }

  /**
   * Get pending invitations for a tenant
   */
  async getPendingInvitationsForTenant(
    tenantId: string,
  ): Promise<Invitation[]> {
    try {
      const result = await this.postgres.query(
        `SELECT i.*,
                u.full_name as invited_by_name,
                u.email as invited_by_email
         FROM public.invitations i
         JOIN auth.users u ON u.id = i.invited_by_user_id
         WHERE i.tenant_id = $1 AND i.status = 'pending'
         ORDER BY i.invited_at DESC`,
        [tenantId],
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      throw error;
    }
  }

  /**
   * Get pending invitations for an email
   */
  async getPendingInvitationsForEmail(email: string): Promise<Invitation[]> {
    try {
      const result = await this.postgres.query(
        `SELECT i.*,
                t.name as tenant_name,
                u.full_name as invited_by_name,
                u.email as invited_by_email
         FROM public.invitations i
         JOIN public.tenants t ON t.id = i.tenant_id
         JOIN auth.users u ON u.id = i.invited_by_user_id
         WHERE i.email = $1 
           AND i.status = 'pending'
           AND i.expires_at > NOW()
         ORDER BY i.invited_at DESC`,
        [email],
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      throw error;
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      // Verify user has permission (invited_by_user_id or tenant admin)
      const result = await this.postgres.query(
        `UPDATE public.invitations 
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND invited_by_user_id = $2 AND status = 'pending'
         RETURNING id`,
        [invitationId, userId],
      );

      if (result.rows.length === 0) {
        throw new Error(
          "Invitation not found or you do not have permission to cancel it",
        );
      }

      console.log("Invitation cancelled:", invitationId);
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      throw error;
    }
  }

  /**
   * Generate secure invitation token
   */
  private generateInvitationToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * Auto-accept pending invitations during registration
   * Called when a new user registers with an email that has pending invitations
   */
  async autoAcceptPendingInvitations(
    email: string,
    userId: string,
  ): Promise<number> {
    console.log("=== AUTO-ACCEPT INVITATIONS START ===");
    console.log("Checking invitations for:", email);

    const client = await this.postgres.getClient();
    let acceptedCount = 0;

    try {
      await client.queryArray("BEGIN");

      // Get all pending invitations for this email
      const invitationsResult = await client.queryObject<Invitation>(
        `SELECT * FROM public.invitations 
         WHERE email = $1 
           AND status = 'pending' 
           AND expires_at > NOW()
         FOR UPDATE`,
        [email],
      );

      const invitations = invitationsResult.rows;

      if (invitations.length === 0) {
        console.log("✓ No pending invitations found");
        await client.queryArray("COMMIT");
        return 0;
      }

      console.log(`Found ${invitations.length} pending invitation(s)`);

      // Accept each invitation
      for (const invitation of invitations) {
        try {
          // Check if already a member
          const memberCheck = await client.queryObject(
            `SELECT id FROM public.user_tenants 
             WHERE user_id = $1 AND tenant_id = $2`,
            [userId, invitation.tenant_id],
          );

          if (memberCheck.rows.length > 0) {
            console.log(
              `⚠️ User already member of tenant: ${invitation.tenant_id}`,
            );
            // Still mark invitation as accepted
            await client.queryArray(
              `UPDATE public.invitations 
               SET status = 'accepted', accepted_at = NOW(), accepted_by_user_id = $1
               WHERE id = $2`,
              [userId, invitation.id],
            );
            continue;
          }

          // 🔍 Check if this is the user's first tenant
          const existingTenantsResult = await client.queryObject(
            `SELECT COUNT(*) as count FROM public.user_tenants WHERE user_id = $1`,
            [userId],
          );
          const tenantCount = Number(existingTenantsResult.rows[0]?.count || 0);
          const isPrimary = tenantCount === 0;

          console.log(
            `✓ User has ${tenantCount} existing tenant(s), setting is_primary = ${isPrimary}`,
          );

          // Add user to tenant
          await client.queryArray(
            `INSERT INTO public.user_tenants 
             (user_id, tenant_id, role, is_active, is_primary)
             VALUES ($1, $2, $3, true, $4)`,
            [userId, invitation.tenant_id, invitation.role, isPrimary],
          );

          console.log(
            `✓ Added to tenant: ${invitation.tenant_id} (is_primary: ${isPrimary})`,
          );

          // Mark invitation as accepted
          await client.queryArray(
            `UPDATE public.invitations 
             SET status = 'accepted', accepted_at = NOW(), accepted_by_user_id = $1
             WHERE id = $2`,
            [userId, invitation.id],
          );

          acceptedCount++;
          console.log(
            `✓ Accepted invitation to tenant: ${invitation.tenant_id}`,
          );
        } catch (error) {
          console.error(
            `Error accepting invitation ${invitation.id}:`,
            error.message,
          );
          // Continue with other invitations
        }
      }

      await client.queryArray("COMMIT");

      console.log("=== AUTO-ACCEPT INVITATIONS SUCCESS ===");
      console.log(`Accepted ${acceptedCount} invitation(s)`);

      return acceptedCount;
    } catch (error) {
      await client.queryArray("ROLLBACK");
      console.error("=== AUTO-ACCEPT INVITATIONS FAILED ===");
      console.error("Error:", error.message);
      throw error;
    } finally {
      this.postgres.releaseClient(client);
    }
  }
}

export const invitationService = new InvitationService(postgresService);

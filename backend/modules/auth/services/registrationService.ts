/**
 * ✅ EMAIL VERIFICATION SUPPORT AND REGISTRATION LOGIC:
 * - Tenant creation
 * - User creation
 * - user_tenants relationship
 * - Auto-accept pending invitations
 * - Email verification token generation
 * - Email sending
 * - Returns success message instead of tokens (user must verify email before login)
 */

import { passwordService } from "./passwordService.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";
import { databaseService } from "../../../shared/services/databaseService.ts";
import { invitationService } from "./invitationService.ts";
import { emailService } from "../../../shared/services/emailService.ts"; // ✅ NEW: You'll need to ensure this exists

export class RegistrationService {
  async registerUser(
    email: string,
    password: string,
    fullName: string,
    role: string = "patient",
    workplaceName?: string,
    pharmacyName?: string,
  ) {
    console.log("=== REGISTRATION START (WITH EMAIL VERIFICATION) ===");
    console.log("Registration request for:", {
      email,
      role,
      fullName,
      workplaceName,
      pharmacyName,
    });

    try {
      console.log("Step 1: Checking for existing user...");
      const existingUser = await this.checkExistingUser(email);

      if (existingUser) {
        console.log("User already exists:", existingUser.id);

        // ✅ NEW: Check if user exists but email not verified
        if (!existingUser.email_verified) {
          console.log(
            "⚠️ User exists but email not verified. Resending verification email...",
          );

          // Get tenant_id for existing user
          const tenantId = await this.getTenantIdForUser(existingUser.id);

          if (!tenantId) {
            throw new Error("Could not find tenant for existing user");
          }

          // Create new verification token
          const tokenResult =
            await databaseService.createEmailVerificationToken(
              existingUser.id,
              tenantId,
              existingUser.email,
            );

          if (!tokenResult.success) {
            throw new Error("Failed to create verification token");
          }

          // Send verification email
          const verificationUrl = `${Deno.env.get("FRONTEND_URL")}/verify-email?token=${tokenResult.token}`;

          const sent = await emailService.sendEmailConfirmation(
            email,
            verificationUrl,
          );
          if (!sent) {
            throw new Error("Failed to send verification email");
          }

          console.log("✅ Verification email resent");

          return {
            success: true,
            message:
              "Account already exists. Verification email resent. Please check your inbox.",
            userId: existingUser.id,
            requiresVerification: true,
          };
        }

        // User exists and is verified
        console.log(
          "ERROR: User already exists and is verified:",
          existingUser.id,
        );
        throw new Error("User already exists with this email");
      }

      console.log("✓ No existing user found");

      const userId = crypto.randomUUID();
      const hashedPassword = await passwordService.hashPassword(password);
      console.log("Step 2: Generated userId:", userId);

      // Determine tenant type and name based on role
      let tenantType: string;
      let tenantName: string;

      switch (role) {
        case "patient":
          tenantType = "personal";
          tenantName = `${fullName}'s Health Records`;
          break;
        case "doctor":
        case "cabinet_owner":
          tenantType = "clinic";
          tenantName = workplaceName || `${fullName}'s Clinic`;
          break;
        case "pharmacist":
        case "pharmacy_owner":
          tenantType = "pharmacy";
          tenantName = pharmacyName || `${fullName}'s Pharmacy`;
          break;
        default:
          tenantType = "personal";
          tenantName = `${fullName}'s Account`;
      }

      console.log("Step 3: Determined tenant type:", {
        tenantType,
        tenantName,
      });

      console.log("Step 4: Checking for existing tenant...");
      const existingTenant = await this.checkExistingTenant(userId);

      let tenant;
      if (existingTenant) {
        console.log("✓ Found existing tenant:", {
          id: existingTenant.id,
          name: existingTenant.name,
          schema: existingTenant.schema,
        });
        tenant = existingTenant;
      } else {
        console.log("Step 4a: Creating new tenant with type...");
        tenant = await this.createTenantWithType(
          userId,
          tenantType,
          tenantName,
          role,
        );
        console.log("✓ Tenant created successfully:", {
          id: tenant.id,
          name: tenant.name,
          schema: tenant.schema,
        });
      }

      // ✅ MODIFIED: Create user in auth.users with email_verified = false
      console.log(
        "Step 5: Creating user in auth.users (email_verified=false)...",
      );
      const user = await databaseService.createUserInAuthTable(
        userId,
        email,
        fullName,
        hashedPassword,
        role,
      );
      console.log("✓ User created in auth.users:", user.id);

      if (!existingTenant) {
        console.log("Step 6: Updating tenant record...");
        await postgresService.updateTenantWithUser(tenant.id, userId);
        console.log("✓ Tenant updated with user association");
      } else {
        console.log("Step 6: Skipped tenant update (existing tenant)");
      }

      // Create user_tenants junction record for primary tenant
      console.log("Step 7: Creating primary user_tenants relationship...");
      await postgresService.query(
        `INSERT INTO public.user_tenants 
         (user_id, tenant_id, is_primary, role, is_active) 
         VALUES ($1, $2, true, $3, true)`,
        [userId, tenant.id, role],
      );
      console.log("✓ Primary user_tenants record created:", {
        userId,
        tenantId: tenant.id,
        role,
      });

      // Auto-accept any pending invitations for this email
      console.log("Step 8: Checking for pending invitations...");
      const acceptedCount =
        await invitationService.autoAcceptPendingInvitations(email, userId);

      if (acceptedCount > 0) {
        console.log(`✓ Auto-accepted ${acceptedCount} pending invitation(s)`);
      } else {
        console.log("✓ No pending invitations to accept");
      }

      // ============================================================================
      // ✅ NEW: EMAIL VERIFICATION FLOW
      // ============================================================================

      console.log("Step 9: Creating email verification token...");
      const tokenResult = await databaseService.createEmailVerificationToken(
        userId,
        tenant.id,
        email,
      );

      if (!tokenResult.success) {
        console.error(
          "❌ Failed to create verification token:",
          tokenResult.error,
        );
        // Rollback user creation if verification token fails
        await this.rollbackUserCreation(userId, tenant.id);
        throw new Error("Failed to create verification token");
      }

      console.log("✓ Verification token created:", tokenResult.token);

      // Send verification email
      console.log("Step 10: Sending verification email...");
      const verificationUrl = `${Deno.env.get("FRONTEND_URL")}/verify-email?token=${tokenResult.token}`;

      try {
        const sent = await emailService.sendEmailConfirmation(
          email,
          verificationUrl,
        );
        if (!sent) {
          throw new Error("Failed to send verification email");
        }
        console.log("✓ Verification email sent successfully");
      } catch (emailError) {
        console.error("❌ Failed to send verification email:", emailError);
        // Don't rollback - user can request a new verification email
        // Just log the error and continue
        console.warn(
          "⚠️ User created but verification email failed. User can resend verification email.",
        );
      }

      // ============================================================================
      // ✅ MODIFIED: Return success message WITHOUT tokens
      // User must verify email before they can login
      // ============================================================================

      const result = {
        success: true,
        message:
          "Registration successful! Please check your email to verify your account.",
        userId: user.id,
        email: user.email,
        requiresVerification: true,
        invitations_accepted: acceptedCount,
        // ❌ NO TOKENS - User must verify email first
      };

      console.log("=== REGISTRATION SUCCESS (EMAIL VERIFICATION REQUIRED) ===");
      console.log("Final result:", {
        userId: result.userId,
        email: result.email,
        requiresVerification: result.requiresVerification,
        invitationsAccepted: result.invitations_accepted,
      });

      return result;
    } catch (error) {
      console.error("=== REGISTRATION FAILED ===");
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  }

  /**
   * ✅ NEW: Helper method to rollback user creation if email verification fails
   */
  private async rollbackUserCreation(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    console.log("🔄 Rolling back user creation...");

    try {
      // Delete from user_tenants
      await postgresService.query(
        `DELETE FROM public.user_tenants WHERE user_id = $1`,
        [userId],
      );

      // Delete from auth.users
      await postgresService.query(`DELETE FROM auth.users WHERE id = $1`, [
        userId,
      ]);

      // Note: We don't delete the tenant as it might be needed for future registration attempts

      console.log("✓ User creation rolled back");
    } catch (rollbackError) {
      console.error("❌ Error during rollback:", rollbackError);
      // Log but don't throw - we've already failed
    }
  }

  /**
   * ✅ NEW: Helper method to get tenant_id for a user
   */
  private async getTenantIdForUser(userId: string): Promise<string | null> {
    try {
      const result = await postgresService.query(
        `SELECT tenant_id FROM public.user_tenants WHERE user_id = $1 AND is_primary = true LIMIT 1`,
        [userId],
      );

      if (result.rows.length > 0) {
        return result.rows[0].tenant_id;
      }

      return null;
    } catch (error) {
      console.error("Error getting tenant_id for user:", error);
      return null;
    }
  }

  private async createTenantWithType(
    userId: string,
    tenantType: string,
    tenantName: string,
    role: string,
  ): Promise<any> {
    const tenantId = crypto.randomUUID();
    const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;

    console.log("Creating tenant:", {
      tenantId,
      tenantType,
      tenantName,
      schemaName,
    });

    const result = await postgresService.query(
      `INSERT INTO public.tenants 
       (id, name, schema, domain, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING *`,
      [tenantId, tenantName, schemaName, userId],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create tenant record");
    }

    const tenant = result.rows[0];

    // Create tenant schema (empty for now - business tables added later)
    await postgresService.createTenantSchema(schemaName);

    console.log("Tenant created:", {
      id: tenant.id,
      name: tenant.name,
    });

    return tenant;
  }

  private async checkExistingUser(email: string) {
    try {
      console.log("Checking for existing user with email:", email);

      const result = await postgresService.query(
        "SELECT * FROM auth.users WHERE email = $1 LIMIT 1",
        [email],
      );

      if (result.rows.length > 0) {
        console.log("Found existing user:", result.rows[0].id);
        return result.rows[0];
      }

      console.log("✓ No existing user found");
      return null;
    } catch (error) {
      console.error("Error checking existing user:", error.message);
      throw error;
    }
  }

  private async checkExistingTenant(userId: string) {
    try {
      console.log(
        "Checking for existing tenant with user ID as domain:",
        userId,
      );

      const result = await postgresService.query(
        "SELECT * FROM public.tenants WHERE domain = $1 AND is_active = true LIMIT 1",
        [userId],
      );

      if (result.rows.length > 0) {
        console.log("Found existing tenant:", result.rows[0].id);
        return result.rows[0];
      }

      console.log("✓ No existing tenant found for user");
      return null;
    } catch (error) {
      console.error("Error checking existing tenant:", error.message);
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();

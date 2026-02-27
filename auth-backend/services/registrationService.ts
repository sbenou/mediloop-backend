import { passwordService } from "./passwordService.ts";
import { postgresService } from "./postgresService.ts";
import { databaseService } from "./databaseService.ts";
import { invitationService } from "./invitationService.ts";

export class RegistrationService {
  async registerUser(
    email: string,
    password: string,
    fullName: string,
    role: string = "patient",
    workplaceName?: string,
    pharmacyName?: string,
  ) {
    console.log("=== REGISTRATION START ===");
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
        console.log("ERROR: User already exists:", existingUser.id);
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

      // Create user in auth.users
      console.log("Step 5: Creating user in auth.users...");
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

      // ✅ NEW: Auto-accept any pending invitations for this email
      console.log("Step 8: Checking for pending invitations...");
      const acceptedCount =
        await invitationService.autoAcceptPendingInvitations(email, userId);

      if (acceptedCount > 0) {
        console.log(`✓ Auto-accepted ${acceptedCount} pending invitation(s)`);
      } else {
        console.log("✓ No pending invitations to accept");
      }

      // Return user data
      const result = {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        tenant_id: tenant.id,
        invitations_accepted: acceptedCount,
      };

      console.log("=== REGISTRATION SUCCESS ===");
      console.log("Final result:", {
        userId: result.id,
        tenantId: result.tenant_id,
        email: result.email,
        role: result.role,
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

import { PostgresClient } from "./PostgresClient.ts";
import { SchemaManager } from "./SchemaManager.ts";

export class TenantManager {
  constructor(
    private client: PostgresClient,
    private schemaManager: SchemaManager,
  ) {}

  async createTenantForUser(
    userId: string,
    role: string,
    fullName: string,
    workplaceName?: string,
    pharmacyName?: string,
  ): Promise<string> {
    console.log("Creating tenant for user:", { userId, role, fullName });

    // Determine tenant name based on role
    let tenantName: string;
    switch (role) {
      case "patient":
        tenantName = `Patient - ${fullName}`;
        break;
      case "doctor":
        tenantName = workplaceName || `Dr. ${fullName} Cabinet`;
        break;
      case "pharmacist":
        tenantName = pharmacyName || `Pharmacy - ${fullName}`;
        break;
      default:
        tenantName = `${fullName} Workspace`;
    }

    // Create schema name (sanitized)
    const schemaName = `tenant_${role}_${userId.replace(/-/g, "_")}`;

    console.log("Creating tenant with schema:", schemaName);

    // Check if tenant already exists
    const existingTenant = await this.client.query(
      "SELECT id FROM public.tenants WHERE domain = $1",
      [userId],
    );

    if (existingTenant.rows && existingTenant.rows.length > 0) {
      console.log("Tenant already exists for user:", userId);
      return (existingTenant.rows[0] as { id: string }).id;
    }

    // Create tenant record
    const tenantResult = await this.client.query(
      `
      INSERT INTO public.tenants (name, domain, schema, is_active, status)
      VALUES ($1, $2, $3, true, 'active')
      RETURNING id
    `,
      [tenantName, userId, schemaName],
    );

    const tenantId = (tenantResult.rows[0] as { id: string }).id;
    console.log("Created tenant record with ID:", tenantId);

    // Create schema and tables
    await this.schemaManager.createTenantSchema(schemaName);

    console.log("✅ Tenant creation completed successfully");
    return tenantId;
  }

  async updateTenantName(
    userId: string,
    workplaceName?: string,
    pharmacyName?: string,
  ): Promise<boolean> {
    try {
      // Get user info
      const userResult = await this.client.query(
        "SELECT role, full_name FROM public.profiles WHERE id = $1",
        [userId],
      );

      if (!userResult.rows || userResult.rows.length === 0) {
        return false;
      }

      const { role, full_name } = userResult.rows[0] as {
        role: string;
        full_name: string;
      };

      // Determine new tenant name
      let tenantName: string;
      switch (role) {
        case "doctor":
          tenantName = workplaceName || `Dr. ${full_name} Cabinet`;
          break;
        case "pharmacist":
          tenantName = pharmacyName || `Pharmacy - ${full_name}`;
          break;
        default:
          return true; // No update needed for other roles
      }

      // Update tenant name
      await this.client.query(
        `
        UPDATE public.tenants 
        SET name = $1, updated_at = NOW()
        WHERE domain = $2
      `,
        [tenantName, userId],
      );

      return true;
    } catch (error) {
      console.error("Error updating tenant name:", error);
      return false;
    }
  }

  async getTenantByUserId(userId: string): Promise<Record<string, unknown>> {
    const result = await this.client.query(
      "SELECT * FROM public.tenants WHERE domain = $1",
      [userId],
    );
    return (result.rows[0] as Record<string, unknown>) || null;
  }

  async getTenantBySchema(
    schemaName: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.client.query(
      "SELECT * FROM public.tenants WHERE schema = $1",
      [schemaName],
    );
    return (result.rows[0] as Record<string, unknown>) || null;
  }

  async listAllTenants(): Promise<Record<string, unknown>[]> {
    const result = await this.client.query(
      "SELECT * FROM public.tenants ORDER BY created_at DESC",
    );
    return (result.rows as Record<string, unknown>[]) || [];
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      // Get tenant info first
      const tenantResult = await this.client.query(
        "SELECT schema FROM public.tenants WHERE id = $1",
        [tenantId],
      );

      if (!tenantResult.rows || tenantResult.rows.length === 0) {
        return false;
      }

      const schemaName = (tenantResult.rows[0] as { schema: string }).schema;

      // Drop the schema
      await this.schemaManager.dropTenantSchema(schemaName);

      // Delete tenant record
      await this.client.query("DELETE FROM public.tenants WHERE id = $1", [
        tenantId,
      ]);

      console.log("✅ Tenant deleted successfully:", tenantId);
      return true;
    } catch (error) {
      console.error("Error deleting tenant:", error);
      return false;
    }
  }
}

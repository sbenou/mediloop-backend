import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { config } from "../config/env.ts";
import { configService } from "./configService.ts";

// New modular services
import { PostgresClient } from "./postgres/PostgresClient.ts";
import { TenantManager } from "./postgres/TenantManager.ts";
import { SchemaManager } from "./postgres/SchemaManager.ts";
import { QueryHelper } from "./postgres/QueryHelper.ts";

// This service maintains backward compatibility while using the new modular structure
export class PostgresService {
  private client: PostgresClient;
  private tenantManager: TenantManager;
  private schemaManager: SchemaManager;
  private queryHelper: QueryHelper;

  constructor() {
    // Initialize modular services
    this.client = new PostgresClient();
    this.schemaManager = new SchemaManager(this.client);
    this.tenantManager = new TenantManager(this.client, this.schemaManager);
    this.queryHelper = new QueryHelper(this.client);
  }

  // ========== BACKWARD COMPATIBILITY METHODS ==========
  // These methods maintain the exact same API as before

  async query(
    sql: string,
    params?: unknown[],
  ): Promise<{
    rows: Record<string, unknown>[];
    rowCount?: number;
  }> {
    return await this.client.query(sql, params);
  }

  async queryArray(
    sql: string,
    params?: unknown[],
  ): Promise<{
    rows: unknown[][];
    rowCount?: number;
  }> {
    return await this.client.queryArray(sql, params);
  }

  // ========== TENANT MANAGEMENT (delegated) ==========
  async createTenantForUser(
    userId: string,
    role: string,
    fullName: string,
    workplaceName?: string,
    pharmacyName?: string,
  ): Promise<string> {
    return await this.tenantManager.createTenantForUser(
      userId,
      role,
      fullName,
      workplaceName,
      pharmacyName,
    );
  }

  async updateTenantName(
    userId: string,
    workplaceName?: string,
    pharmacyName?: string,
  ): Promise<boolean> {
    return await this.tenantManager.updateTenantName(
      userId,
      workplaceName,
      pharmacyName,
    );
  }

  async getTenantByUserId(userId: string): Promise<Record<string, unknown>> {
    return await this.tenantManager.getTenantByUserId(userId);
  }

  async getTenantBySchema(
    schemaName: string,
  ): Promise<Record<string, unknown>> {
    return await this.tenantManager.getTenantBySchema(schemaName);
  }

  async listAllTenants(): Promise<Record<string, unknown>[]> {
    return await this.tenantManager.listAllTenants();
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    return await this.tenantManager.deleteTenant(tenantId);
  }

  // ========== SCHEMA MANAGEMENT (delegated) ==========
  async createTenantSchema(schemaName: string): Promise<void> {
    return await this.schemaManager.createTenantSchema(schemaName);
  }

  async schemaExists(schemaName: string): Promise<boolean> {
    return await this.schemaManager.schemaExists(schemaName);
  }

  // ========== QUERY HELPERS (delegated) ==========
  async executeInSchema(
    schemaName: string,
    operation: () => Promise<unknown>,
  ): Promise<unknown> {
    return await this.queryHelper.executeInSchema(schemaName, operation);
  }

  async insertWithReturn(
    table: string,
    data: Record<string, unknown>,
    schema?: string,
  ): Promise<Record<string, unknown>> {
    return await this.queryHelper.insertWithReturn(table, data, schema);
  }

  async updateById(
    table: string,
    id: string,
    data: Record<string, unknown>,
    schema?: string,
  ): Promise<Record<string, unknown>> {
    return await this.queryHelper.updateById(table, id, data, schema);
  }

  async findById(
    table: string,
    id: string,
    schema?: string,
  ): Promise<Record<string, unknown> | null> {
    return await this.queryHelper.findById(table, id, schema);
  }

  async findByField(
    table: string,
    field: string,
    value: unknown,
    schema?: string,
  ): Promise<Record<string, unknown>[]> {
    return await this.queryHelper.findByField(table, field, value, schema);
  }

  async deleteById(
    table: string,
    id: string,
    schema?: string,
  ): Promise<boolean> {
    return await this.queryHelper.deleteById(table, id, schema);
  }

  async exists(
    table: string,
    field: string,
    value: unknown,
    schema?: string,
  ): Promise<boolean> {
    return await this.queryHelper.exists(table, field, value, schema);
  }

  async count(
    table: string,
    whereClause?: string,
    params?: unknown[],
    schema?: string,
  ): Promise<number> {
    return await this.queryHelper.count(table, whereClause, params, schema);
  }

  // ========== LEGACY METHODS (maintained for compatibility) ==========

  // Keep the old connection management methods for backward compatibility
  async connect() {
    // Delegated to PostgresClient
    await this.client.ensureConnection();
  }

  private async ensureConnection() {
    await this.client.ensureConnection();
  }

  // ========== MISSING CRITICAL METHODS ==========

  async getClient(): Promise<Client | null> {
    await this.client.ensureConnection();
    return this.client.getClient();
  }

  releaseClient(client: Client | null) {
    // In the new architecture, we don't release individual clients
    // since we maintain a single connection pool
    // This is kept for backward compatibility but does nothing
    console.log("releaseClient called (no-op in new architecture)");
  }

  async close() {
    await this.client.disconnect();
  }

  // ========== USER MANAGEMENT ==========
  // ✅ FIXED: Changed all auth.users → auth.users
  async createUser(
    email: string,
    password: string,
    salt: string,
    fullName: string,
    role: string = "patient",
    status: string = "active",
  ): Promise<Record<string, unknown>> {
    const result = await this.query(
      `
      INSERT INTO auth.users (id, email, password, salt, full_name, role, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())
      RETURNING *
    `,
      [email, password, salt, fullName, role, status],
    );

    return result.rows[0];
  }

  async findUserByEmail(
    email: string,
  ): Promise<Record<string, unknown> | null> {
    const result = await this.query(
      "SELECT * FROM auth.users WHERE email = $1",
      [email],
    );
    return result.rows[0] || null;
  }

  async findUserById(userId: string): Promise<Record<string, unknown> | null> {
    const result = await this.query("SELECT * FROM auth.users WHERE id = $1", [
      userId,
    ]);
    return result.rows[0] || null;
  }

  async updateUser(
    userId: string,
    updates: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const columns = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = columns
      .map((col, index) => `${col} = $${index + 2}`)
      .join(", ");

    const result = await this.query(
      `
      UPDATE auth.users
      SET ${setClause}, updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
      [userId, ...values],
    );

    return result.rows[0];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.query(
      "UPDATE auth.users SET status = 'deleted', updated_at = now() WHERE id = $1",
      [userId],
    );
    return (result.rowCount || 0) > 0;
  }

  // ========== AUTHENTICATION ==========
  async validateCredentials(
    email: string,
    password: string,
    salt: string,
  ): Promise<Record<string, unknown> | null> {
    const result = await this.query(
      `
      SELECT * FROM auth.users 
      WHERE email = $1 AND password = $2 AND salt = $3 AND status = 'active'
    `,
      [email, password, salt],
    );

    return result.rows[0] || null;
  }

  // ========== UTILITY METHODS ==========
  async checkConnection(): Promise<boolean> {
    try {
      await this.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Database connection check failed:", error);
      return false;
    }
  }

  async getDatabaseVersion(): Promise<string> {
    const result = await this.query("SELECT version()");
    return result.rows[0].version as string;
  }

  async getSchemaList(): Promise<string[]> {
    const result = await this.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    return result.rows.map(
      (row: Record<string, unknown>) => row.schema_name as string,
    );
  }

  async getTableList(schemaName: string = "public"): Promise<string[]> {
    const result = await this.query(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `,
      [schemaName],
    );
    return result.rows.map(
      (row: Record<string, unknown>) => row.table_name as string,
    );
  }

  // ========== MISSING METHODS FOR REGISTRATION SERVICE ==========

  async getAllTenantSchemas(): Promise<string[]> {
    const result = await this.query(`
      SELECT schema
      FROM public.tenants
      WHERE is_active = true
      ORDER BY schema
    `);
    return result.rows.map(
      (row: Record<string, unknown>) => row.schema as string,
    );
  }

  async getUserProfileByEmailInSchema(
    schema: string,
    email: string,
  ): Promise<Record<string, unknown>> {
    try {
      const result = (await this.executeInSchema(schema, async () => {
        return await this.query(
          `
          SELECT * FROM profiles 
          WHERE email = $1 
          LIMIT 1
        `,
          [email],
        );
      })) as { rows: Record<string, unknown>[] };

      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }

      throw new Error("Profile not found");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Profile not found: ${message}`);
    }
  }

  /**
   * ✅ FIXED: Removed the public.profiles UPDATE
   *
   * In our multi-tenant architecture:
   * - auth.users (global authentication)
   * - {tenant_schema}.profiles (tenant-specific user data)
   * - NO public.profiles table exists!
   */
  async updateTenantWithUser(tenantId: string, userId: string): Promise<void> {
    // Update tenant record's timestamp
    await this.query(
      `
      UPDATE public.tenants 
      SET updated_at = NOW()
      WHERE id = $1
    `,
      [tenantId],
    );

    // ❌ REMOVED: This was trying to update non-existent public.profiles table
    // The profile was already created in the tenant schema by databaseService.createUserWithPasswordInSchema
    console.log(
      `✅ Tenant ${tenantId} updated successfully (profile already exists in tenant schema)`,
    );
  }
}

// Export the singleton instance for backward compatibility
export const postgresService = new PostgresService();

// Also export the class for those who want to create their own instances
export { PostgresService as PostgresServiceClass };

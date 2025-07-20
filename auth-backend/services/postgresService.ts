import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts"
import { config } from "../config/env.ts"
import { configService } from './configService.ts'

// New modular services
import { PostgresClient } from "./postgres/PostgresClient.ts"
import { TenantManager } from "./postgres/TenantManager.ts"
import { SchemaManager } from "./postgres/SchemaManager.ts"
import { QueryHelper } from "./postgres/QueryHelper.ts"

// This service maintains backward compatibility while using the new modular structure
export class PostgresService {
  private client: PostgresClient
  private tenantManager: TenantManager
  private schemaManager: SchemaManager
  private queryHelper: QueryHelper

  constructor() {
    configService.initialize()
    
    // Initialize modular services
    this.client = new PostgresClient()
    this.schemaManager = new SchemaManager(this.client)
    this.tenantManager = new TenantManager(this.client, this.schemaManager)
    this.queryHelper = new QueryHelper(this.client)
  }

  // ========== BACKWARD COMPATIBILITY METHODS ==========
  // These methods maintain the exact same API as before

  async query(sql: string, params?: any[]): Promise<any> {
    return await this.client.query(sql, params)
  }

  async queryArray(sql: string, params?: any[]): Promise<any> {
    return await this.client.queryArray(sql, params)
  }

  // ========== TENANT MANAGEMENT (delegated) ==========
  async createTenantForUser(userId: string, role: string, fullName: string, workplaceName?: string, pharmacyName?: string): Promise<string> {
    return await this.tenantManager.createTenantForUser(userId, role, fullName, workplaceName, pharmacyName)
  }

  async updateTenantName(userId: string, workplaceName?: string, pharmacyName?: string): Promise<boolean> {
    return await this.tenantManager.updateTenantName(userId, workplaceName, pharmacyName)
  }

  async getTenantByUserId(userId: string): Promise<any> {
    return await this.tenantManager.getTenantByUserId(userId)
  }

  async getTenantBySchema(schemaName: string): Promise<any> {
    return await this.tenantManager.getTenantBySchema(schemaName)
  }

  async listAllTenants(): Promise<any[]> {
    return await this.tenantManager.listAllTenants()
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    return await this.tenantManager.deleteTenant(tenantId)
  }

  // ========== SCHEMA MANAGEMENT (delegated) ==========
  async createTenantSchema(schemaName: string): Promise<void> {
    return await this.schemaManager.createTenantSchema(schemaName)
  }

  async schemaExists(schemaName: string): Promise<boolean> {
    return await this.schemaManager.schemaExists(schemaName)
  }

  // ========== QUERY HELPERS (delegated) ==========
  async executeInSchema(schemaName: string, operation: () => Promise<any>): Promise<any> {
    return await this.queryHelper.executeInSchema(schemaName, operation)
  }

  async insertWithReturn(table: string, data: Record<string, any>, schema?: string): Promise<any> {
    return await this.queryHelper.insertWithReturn(table, data, schema)
  }

  async updateById(table: string, id: string, data: Record<string, any>, schema?: string): Promise<any> {
    return await this.queryHelper.updateById(table, id, data, schema)
  }

  async findById(table: string, id: string, schema?: string): Promise<any> {
    return await this.queryHelper.findById(table, id, schema)
  }

  async findByField(table: string, field: string, value: any, schema?: string): Promise<any[]> {
    return await this.queryHelper.findByField(table, field, value, schema)
  }

  async deleteById(table: string, id: string, schema?: string): Promise<boolean> {
    return await this.queryHelper.deleteById(table, id, schema)
  }

  async exists(table: string, field: string, value: any, schema?: string): Promise<boolean> {
    return await this.queryHelper.exists(table, field, value, schema)
  }

  async count(table: string, whereClause?: string, params?: any[], schema?: string): Promise<number> {
    return await this.queryHelper.count(table, whereClause, params, schema)
  }

  // ========== LEGACY METHODS (maintained for compatibility) ==========
  
  // Keep the old connection management methods for backward compatibility
  async connect() {
    // Delegated to PostgresClient
    await this.client.ensureConnection()
  }

  private async ensureConnection() {
    await this.client.ensureConnection()
  }

  // ========== MISSING CRITICAL METHODS ==========
  
  async getClient(): Promise<Client | null> {
    await this.client.ensureConnection()
    return this.client.getClient()
  }

  releaseClient(client: Client | null) {
    // In the new architecture, we don't release individual clients
    // since we maintain a single connection pool
    // This is kept for backward compatibility but does nothing
    console.log('releaseClient called (no-op in new architecture)')
  }

  getClient(): Client | null {
    return this.client.getClient()
  }

  async close() {
    await this.client.disconnect()
  }

  // ========== USER MANAGEMENT ==========
  async createUser(email: string, passwordHash: string, fullName: string, role: string = 'patient', licenseNumber?: string): Promise<any> {
    const result = await this.query(`
      INSERT INTO public.profiles (id, email, password_hash, full_name, role, license_number, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now(), now())
      RETURNING *
    `, [email, passwordHash, fullName, role, licenseNumber])
    
    return result.rows[0]
  }

  async findUserByEmail(email: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM public.profiles WHERE email = $1 AND deleted_at IS NULL',
      [email]
    )
    return result.rows[0] || null
  }

  async findUserById(userId: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM public.profiles WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    )
    return result.rows[0] || null
  }

  async updateUser(userId: string, updates: Record<string, any>): Promise<any> {
    const columns = Object.keys(updates)
    const values = Object.values(updates)
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ')
    
    const result = await this.query(`
      UPDATE public.profiles
      SET ${setClause}, updated_at = now()
      WHERE id = $1
      RETURNING *
    `, [userId, ...values])
    
    return result.rows[0]
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await this.query(
      'UPDATE public.profiles SET deleted_at = now() WHERE id = $1',
      [userId]
    )
    return result.rowCount > 0
  }

  // ========== AUTHENTICATION ==========
  async validateCredentials(email: string, passwordHash: string): Promise<any> {
    const result = await this.query(`
      SELECT * FROM public.profiles 
      WHERE email = $1 AND password_hash = $2 AND deleted_at IS NULL
    `, [email, passwordHash])
    
    return result.rows[0] || null
  }

  // ========== UTILITY METHODS ==========
  async checkConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1')
      return true
    } catch (error) {
      console.error('Database connection check failed:', error)
      return false
    }
  }

  async getDatabaseVersion(): Promise<string> {
    const result = await this.query('SELECT version()')
    return result.rows[0].version
  }

  async getSchemaList(): Promise<string[]> {
    const result = await this.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `)
    return result.rows.map(row => row.schema_name)
  }

  async getTableList(schemaName: string = 'public'): Promise<string[]> {
    const result = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `, [schemaName])
    return result.rows.map(row => row.table_name)
  }
}

// Export the singleton instance for backward compatibility
export const postgresService = new PostgresService()

// Also export the class for those who want to create their own instances
export { PostgresService as PostgresServiceClass }

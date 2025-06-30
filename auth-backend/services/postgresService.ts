
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import { config } from "../config/env.ts"

// This service handles direct PostgreSQL operations using Neon
export class PostgresService {
  private client: Client | null = null

  constructor() {
    this.connect()
  }

  private async connect() {
    if (!this.client) {
      this.client = new Client(config.DATABASE_URL)
      await this.client.connect()
      console.log('Connected to Neon PostgreSQL database')
    }
  }

  private async ensureConnection() {
    if (!this.client) {
      await this.connect()
    }
  }

  async query(text: string, params?: any[]) {
    await this.ensureConnection()
    return await this.client!.queryObject(text, params)
  }

  async getOrCreateUserProfile(email: string, fullName: string, authMethod: string = 'oauth') {
    console.log('Getting or creating user profile for:', email)
    
    // First check if user exists
    const existingResult = await this.query(
      'SELECT * FROM profiles WHERE email = $1 LIMIT 1',
      [email]
    )

    if (existingResult.rows.length > 0) {
      console.log('Found existing user profile:', existingResult.rows[0].id)
      return existingResult.rows[0]
    }

    // Create new user profile
    console.log('Creating new user profile')
    const newUserId = crypto.randomUUID()
    
    const insertResult = await this.query(
      `INSERT INTO profiles (id, email, full_name, role, auth_method, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        newUserId,
        email,
        fullName,
        'patient', // Default role
        authMethod,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    if (insertResult.rows.length === 0) {
      throw new Error('Failed to create user profile')
    }

    console.log('Created new user profile:', insertResult.rows[0].id)
    return insertResult.rows[0]
  }

  async getUserProfile(userId: string) {
    const result = await this.query(
      'SELECT * FROM profiles WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    )

    if (result.rows.length === 0) {
      throw new Error('Profile not found')
    }

    return result.rows[0]
  }

  async getUserProfileByEmail(email: string) {
    const result = await this.query(
      'SELECT * FROM profiles WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [email]
    )

    if (result.rows.length === 0) {
      throw new Error('Profile not found')
    }

    return result.rows[0]
  }

  async createUserWithPassword(userId: string, email: string, fullName: string, hashedPassword: string, role: string) {
    const result = await this.query(
      `INSERT INTO profiles (id, email, full_name, role, auth_method, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        email,
        fullName,
        role,
        'password',
        hashedPassword,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    if (result.rows.length === 0) {
      throw new Error('Failed to create user profile')
    }

    return result.rows[0]
  }

  async verifyUserPassword(email: string, password: string): Promise<any> {
    const profile = await this.getUserProfileByEmail(email);
    
    if (!profile.password_hash) {
      throw new Error('Invalid login credentials - no password set for this account')
    }

    // Import password service here to avoid circular dependency
    const { passwordService } = await import('./passwordService.ts');
    const isValidPassword = await passwordService.verifyPassword(password, profile.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid login credentials')
    }

    return profile;
  }

  // Additional utility methods
  async getAllProfiles() {
    return await this.query('SELECT * FROM profiles WHERE deleted_at IS NULL ORDER BY created_at DESC')
  }

  async updateProfile(userId: string, updates: any) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const values = [userId, ...Object.values(updates)]
    
    return await this.query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )
  }

  async softDeleteProfile(userId: string) {
    return await this.query(
      'UPDATE profiles SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
      [userId]
    )
  }

  async toggleBlockUser(userId: string) {
    return await this.query(
      'UPDATE profiles SET is_blocked = NOT is_blocked, updated_at = NOW() WHERE id = $1 RETURNING *',
      [userId]
    )
  }

  async getRoles() {
    return await this.query('SELECT * FROM roles ORDER BY name')
  }

  async getPermissions() {
    return await this.query('SELECT * FROM permissions ORDER BY name')
  }

  async getRolePermissions(roleId: string) {
    return await this.query(
      `SELECT p.* FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = $1`,
      [roleId]
    )
  }

  async getUsersByRole(role: string) {
    return await this.query(
      'SELECT * FROM profiles WHERE role = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [role]
    )
  }

  async close() {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }
}

export const postgresService = new PostgresService()

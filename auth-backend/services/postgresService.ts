
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
      `SELECT p.*, r.name as role_name 
       FROM profiles p 
       LEFT JOIN roles r ON p.role_id = r.id 
       WHERE p.email = $1 LIMIT 1`,
      [email]
    )

    if (existingResult.rows.length > 0) {
      console.log('Found existing user profile:', existingResult.rows[0].id)
      return existingResult.rows[0]
    }

    // Create new user profile with default patient role
    console.log('Creating new user profile')
    const newUserId = crypto.randomUUID()
    
    // Get patient role ID
    const roleResult = await this.query(
      'SELECT id FROM roles WHERE name = $1 LIMIT 1',
      ['patient']
    )
    
    if (roleResult.rows.length === 0) {
      throw new Error('Patient role not found in database')
    }
    
    const patientRoleId = roleResult.rows[0].id
    
    const insertResult = await this.query(
      `INSERT INTO profiles (id, email, full_name, role_id, auth_method, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        newUserId,
        email,
        fullName,
        patientRoleId,
        authMethod,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    if (insertResult.rows.length === 0) {
      throw new Error('Failed to create user profile')
    }

    // Return with role name
    const newProfile = insertResult.rows[0]
    newProfile.role_name = 'patient'
    newProfile.role = 'patient' // For compatibility
    
    console.log('Created new user profile:', insertResult.rows[0].id)
    return newProfile
  }

  async getUserProfile(userId: string) {
    const result = await this.query(
      `SELECT p.*, r.name as role_name, r.name as role 
       FROM profiles p 
       LEFT JOIN roles r ON p.role_id = r.id 
       WHERE p.id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      throw new Error('Profile not found')
    }

    return result.rows[0]
  }

  async getUserProfileByEmail(email: string) {
    const result = await this.query(
      `SELECT p.*, r.name as role_name, r.name as role 
       FROM profiles p 
       LEFT JOIN roles r ON p.role_id = r.id 
       WHERE p.email = $1 LIMIT 1`,
      [email]
    )

    if (result.rows.length === 0) {
      throw new Error('Profile not found')
    }

    return result.rows[0]
  }

  async getRoleByName(roleName: string) {
    const result = await this.query(
      'SELECT * FROM roles WHERE name = $1 LIMIT 1',
      [roleName]
    )

    if (result.rows.length === 0) {
      throw new Error(`Role '${roleName}' not found`)
    }

    return result.rows[0]
  }

  async createUserWithPassword(userId: string, email: string, fullName: string, hashedPassword: string, roleName: string) {
    // Get role ID from role name
    const role = await this.getRoleByName(roleName)
    
    const result = await this.query(
      `INSERT INTO profiles (id, email, full_name, role_id, auth_method, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        email,
        fullName,
        role.id,
        'password',
        hashedPassword,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    if (result.rows.length === 0) {
      throw new Error('Failed to create user profile')
    }

    // Add role name for compatibility
    const profile = result.rows[0]
    profile.role = roleName
    profile.role_name = roleName

    return profile
  }

  async verifyUserPassword(email: string, password: string): Promise<any> {
    const profile = await this.getUserProfileByEmail(email);
    
    if (!profile.password_hash) {
      throw new Error('Invalid login credentials')
    }

    // Import password service here to avoid circular dependency
    const { passwordService } = await import('./passwordService.ts');
    const isValidPassword = await passwordService.verifyPassword(password, profile.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid login credentials')
    }

    return profile;
  }

  async createTenant(userId: string, userRole: string, userName: string, workplaceName?: string, pharmacyName?: string) {
    console.log('Creating tenant for user:', userId, 'with role:', userRole)
    
    // Determine tenant name based on role
    let tenantName: string
    switch (userRole) {
      case 'patient':
        tenantName = `Patient - ${userName}`
        break
      case 'doctor':
        tenantName = workplaceName || `Dr. ${userName} Cabinet`
        break
      case 'pharmacist':
        tenantName = pharmacyName || `Pharmacy - ${userName}`
        break
      default:
        tenantName = `${userName} Workspace`
    }
    
    // Create schema name
    const schemaName = `tenant_${userRole.toLowerCase()}_${userId.replace(/-/g, '_')}`
    
    // Create tenant record
    const result = await this.query(
      `INSERT INTO tenants (name, domain, schema, is_active, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tenantName,
        userId, // Use user ID as domain
        schemaName,
        true,
        'active',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    if (result.rows.length === 0) {
      throw new Error('Failed to create tenant')
    }

    const tenantId = result.rows[0].id

    // Update user profile with tenant_id
    await this.query(
      'UPDATE profiles SET tenant_id = $1, updated_at = $2 WHERE id = $3',
      [tenantId, new Date().toISOString(), userId]
    )

    console.log('Created tenant:', tenantId, 'for user:', userId)
    return result.rows[0]
  }

  async close() {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }
}

export const postgresService = new PostgresService()

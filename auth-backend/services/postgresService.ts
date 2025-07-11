import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts"
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
    
    // First check if user exists in public.profiles
    const existingResult = await this.query(
      `SELECT p.*, r.name as role_name 
       FROM public.profiles p 
       LEFT JOIN public.roles r ON p.role_id = r.id 
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
      'SELECT id FROM public.roles WHERE name = $1 LIMIT 1',
      ['patient']
    )
    
    if (roleResult.rows.length === 0) {
      throw new Error('Patient role not found in database')
    }
    
    const patientRoleId = roleResult.rows[0].id
    
    const insertResult = await this.query(
      `INSERT INTO public.profiles (id, email, full_name, role_id, auth_method, created_at, updated_at)
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
       FROM public.profiles p 
       LEFT JOIN public.roles r ON p.role_id = r.id 
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
       FROM public.profiles p 
       LEFT JOIN public.roles r ON p.role_id = r.id 
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
      'SELECT * FROM public.roles WHERE name = $1 LIMIT 1',
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
      `INSERT INTO public.profiles (id, email, full_name, role_id, auth_method, password_hash, created_at, updated_at)
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
    
    // Get user's current profile data from public.profiles
    const userProfile = await this.query(
      'SELECT * FROM public.profiles WHERE id = $1',
      [userId]
    )
    
    if (userProfile.rows.length === 0) {
      throw new Error('User profile not found in public.profiles')
    }
    
    const profile = userProfile.rows[0]
    
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
      `INSERT INTO public.tenants (name, domain, schema, is_active, status, created_at, updated_at)
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

    // Create the tenant schema
    await this.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    console.log('Created tenant schema:', schemaName)

    // Create all tenant tables in the new schema
    await this.createTenantTables(schemaName)

    // Insert user profile into the tenant-specific profiles table
    await this.query(
      `INSERT INTO "${schemaName}".profiles (
        id, role, role_id, full_name, email, avatar_url, date_of_birth, city, 
        auth_method, is_blocked, doctor_stamp_url, doctor_signature_url, 
        pharmacist_stamp_url, pharmacist_signature_url, cns_card_front, 
        cns_card_back, cns_number, license_number, pharmacy_name, 
        pharmacy_logo_url, doctor_id, tenant_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
      [
        profile.id,
        profile.role || userRole,
        profile.role_id,
        profile.full_name,
        profile.email,
        profile.avatar_url,
        profile.date_of_birth,
        profile.city,
        profile.auth_method,
        profile.is_blocked || false,
        profile.doctor_stamp_url,
        profile.doctor_signature_url,
        profile.pharmacist_stamp_url,
        profile.pharmacist_signature_url,
        profile.cns_card_front,
        profile.cns_card_back,
        profile.cns_number,
        profile.license_number,
        profile.pharmacy_name,
        profile.pharmacy_logo_url,
        profile.doctor_id,
        tenantId, // Set tenant_id in the tenant profile
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )

    // Update user profile in public.profiles with tenant_id
    await this.query(
      'UPDATE public.profiles SET tenant_id = $1, updated_at = $2 WHERE id = $3',
      [tenantId, new Date().toISOString(), userId]
    )

    console.log('Created tenant:', tenantId, 'for user:', userId)
    return result.rows[0]
  }

  private async createTenantTables(schemaName: string) {
    console.log('Creating tables for tenant schema:', schemaName)

    // 1. activities
    await this.query(`
      CREATE TABLE "${schemaName}".activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        related_id UUID,
        related_type TEXT,
        meta JSONB,
        read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
        tenant_id UUID,
        team_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 2. addresses
    await this.query(`
      CREATE TABLE "${schemaName}".addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        type TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 3. boosts
    await this.query(`
      CREATE TABLE "${schemaName}".boosts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 4. categories
    await this.query(`
      CREATE TABLE "${schemaName}".categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 5. doctor_availability
    await this.query(`
      CREATE TABLE "${schemaName}".doctor_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT,
        end_time TEXT,
        is_available BOOLEAN DEFAULT FALSE,
        appointment_type TEXT,
        additional_time_slots JSONB,
        workplace_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 6. doctor_metadata
    await this.query(`
      CREATE TABLE "${schemaName}".doctor_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID,
        logo_url TEXT,
        hours TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 7. doctor_patient_connections
    await this.query(`
      CREATE TABLE "${schemaName}".doctor_patient_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL,
        patient_id UUID NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // 8. doctor_workplaces
    await this.query(`
      CREATE TABLE "${schemaName}".doctor_workplaces (
        id UUID DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        workplace_id UUID,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 9. next_of_kin
    await this.query(`
      CREATE TABLE "${schemaName}".next_of_kin (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        full_name TEXT NOT NULL,
        relation TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 10. notifications
    await this.query(`
      CREATE TABLE "${schemaName}".notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        meta JSONB,
        read BOOLEAN DEFAULT FALSE,
        tenant_id UUID,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 11. orders
    await this.query(`
      CREATE TABLE "${schemaName}".orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        total NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 12. pharmacies
    await this.query(`
      CREATE TABLE "${schemaName}".pharmacies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        phone TEXT,
        hours TEXT,
        endorsed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 13. pharmacy_metadata
    await this.query(`
      CREATE TABLE "${schemaName}".pharmacy_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pharmacy_id UUID,
        logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 14. pharmacy_team_members
    await this.query(`
      CREATE TABLE "${schemaName}".pharmacy_team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pharmacy_id UUID,
        user_id UUID,
        role TEXT DEFAULT 'pharmacy_user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // 15. point_transactions
    await this.query(`
      CREATE TABLE "${schemaName}".point_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        amount INTEGER NOT NULL,
        transaction_type VARCHAR NOT NULL,
        description TEXT,
        reference_id UUID,
        reference_type VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 16. prescriptions
    await this.query(`
      CREATE TABLE "${schemaName}".prescriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL,
        patient_id UUID NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        duration TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 17. products
    await this.query(`
      CREATE TABLE "${schemaName}".products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        type TEXT NOT NULL,
        requires_prescription BOOLEAN DEFAULT FALSE,
        image_url TEXT,
        category_id UUID,
        subcategory_id UUID,
        pharmacy_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 18. profiles (THE MISSING ONE!)
    await this.query(`
      CREATE TABLE "${schemaName}".profiles (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL,
        role_id UUID,
        full_name TEXT,
        email TEXT,
        avatar_url TEXT,
        date_of_birth DATE,
        city TEXT,
        auth_method TEXT DEFAULT 'password',
        is_blocked BOOLEAN DEFAULT FALSE,
        doctor_stamp_url TEXT,
        doctor_signature_url TEXT,
        pharmacist_stamp_url TEXT,
        pharmacist_signature_url TEXT,
        cns_card_front TEXT,
        cns_card_back TEXT,
        cns_number TEXT,
        deleted_at TIMESTAMP WITH TIME ZONE,
        license_number TEXT,
        pharmacy_name TEXT,
        pharmacy_logo_url TEXT,
        doctor_id UUID,
        tenant_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 19. referrals
    await this.query(`
      CREATE TABLE "${schemaName}".referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL,
        referral_email VARCHAR NOT NULL,
        referral_code VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'pending',
        points_awarded INTEGER DEFAULT 0,
        referral_points_received INTEGER DEFAULT 0,
        converted_at TIMESTAMP WITH TIME ZONE,
        subscription_purchased_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 20. subcategories
    await this.query(`
      CREATE TABLE "${schemaName}".subcategories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 21. teleconsultations
    await this.query(`
      CREATE TABLE "${schemaName}".teleconsultations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL,
        patient_id UUID NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        room_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 22. user_notification_tokens
    await this.query(`
      CREATE TABLE "${schemaName}".user_notification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token TEXT NOT NULL,
        platform TEXT DEFAULT 'web',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 23. user_pharmacies
    await this.query(`
      CREATE TABLE "${schemaName}".user_pharmacies (
        user_id UUID NOT NULL,
        pharmacy_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 24. user_points
    await this.query(`
      CREATE TABLE "${schemaName}".user_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        points INTEGER DEFAULT 0,
        level VARCHAR DEFAULT 'Bronze',
        total_points_earned INTEGER DEFAULT 0,
        total_points_spent INTEGER DEFAULT 0,
        wallet_balance NUMERIC DEFAULT 0,
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 25. user_wearables
    await this.query(`
      CREATE TABLE "${schemaName}".user_wearables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        device_id TEXT NOT NULL,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        connection_status TEXT DEFAULT 'connected',
        battery_level INTEGER,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        last_synced TIMESTAMP WITH TIME ZONE,
        meta JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    // 26. workplaces
    await this.query(`
      CREATE TABLE "${schemaName}".workplaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        workplace_type TEXT DEFAULT 'cabinet',
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        phone TEXT,
        hours TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `)

    console.log('Successfully created all 26 tenant tables in schema:', schemaName)
  }

  async close() {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }
}

export const postgresService = new PostgresService()

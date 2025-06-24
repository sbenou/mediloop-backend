
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from "../config/env.ts"

// This service handles database operations
// Currently uses Supabase for transition period, but can be replaced with direct PostgreSQL
export class DatabaseService {
  private supabase: any

  constructor() {
    if (config.SUPABASE_URL && config.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    }
  }

  async getOrCreateUserProfile(email: string, fullName: string, authMethod: string = 'oauth') {
    console.log('Getting or creating user profile for:', email)
    
    // First check if user exists
    const { data: existingProfile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking existing profile:', profileError)
      throw new Error('Database error')
    }

    if (existingProfile) {
      console.log('Found existing user profile:', existingProfile.id)
      return existingProfile
    }

    // Create new user profile
    console.log('Creating new user profile')
    const newUserId = crypto.randomUUID()
    
    const { data: newProfile, error: createError } = await this.supabase
      .from('profiles')
      .insert({
        id: newUserId,
        email: email,
        full_name: fullName,
        role: 'patient', // Default role
        auth_method: authMethod,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user profile:', createError)
      throw new Error('Failed to create user profile')
    }

    console.log('Created new user profile:', newProfile.id)
    return newProfile
  }

  async getUserProfile(userId: string) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error('Profile not found')
    }

    return profile
  }

  async getUserProfileByEmail(email: string) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      throw new Error('Database error')
    }

    if (!profile) {
      throw new Error('Profile not found')
    }

    return profile
  }

  async createUserWithPassword(userId: string, email: string, fullName: string, hashedPassword: string, role: string) {
    const { data: newProfile, error: createError } = await this.supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
        auth_method: 'password',
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user profile:', createError)
      throw new Error('Failed to create user profile')
    }

    return newProfile
  }

  async signInWithPassword(email: string, password: string) {
    // This method is now independent - no Supabase Auth dependency
    const profile = await this.getUserProfileByEmail(email);
    
    if (!profile.password_hash) {
      throw new Error('Invalid login credentials - no password set for this account')
    }

    return {
      user: {
        id: profile.id,
        email: profile.email
      }
    }
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
}

export const databaseService = new DatabaseService()

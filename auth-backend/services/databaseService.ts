
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

  async signInWithPassword(email: string, password: string) {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      throw new Error('Invalid credentials')
    }

    return authData
  }
}

export const databaseService = new DatabaseService()

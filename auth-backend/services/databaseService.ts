import { postgresService } from './postgresService.ts'

// This service is now a wrapper around PostgreSQL operations
// Keeping the same interface for compatibility
export class DatabaseService {
  async getOrCreateUserProfile(email: string, fullName: string, authMethod: string = 'oauth') {
    return await postgresService.getOrCreateUserProfile(email, fullName, authMethod)
  }

  async getUserProfile(userId: string) {
    return await postgresService.getUserProfile(userId)
  }

  async getUserProfileByEmail(email: string) {
    return await postgresService.getUserProfileByEmail(email)
  }

  async createUserWithPassword(userId: string, email: string, fullName: string, hashedPassword: string, role: string) {
    return await postgresService.createUserWithPassword(userId, email, fullName, hashedPassword, role)
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
    return await postgresService.verifyUserPassword(email, password)
  }
}

export const databaseService = new DatabaseService()


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
    // Verify password and get user profile
    const profile = await postgresService.verifyUserPassword(email, password)
    
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

  // Additional methods for the new database structure
  async getAllUsers() {
    return await postgresService.query('SELECT * FROM profiles WHERE deleted_at IS NULL ORDER BY created_at DESC')
  }

  async updateUserProfile(userId: string, updates: any) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    
    const values = [userId, ...Object.values(updates)]
    
    return await postgresService.query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )
  }

  async deleteUser(userId: string) {
    return await postgresService.query(
      'UPDATE profiles SET deleted_at = NOW() WHERE id = $1',
      [userId]
    )
  }

  async blockUser(userId: string) {
    return await postgresService.query(
      'UPDATE profiles SET is_blocked = NOT is_blocked WHERE id = $1',
      [userId]
    )
  }

  async getRoles() {
    return await postgresService.query('SELECT * FROM roles ORDER BY name')
  }

  async getPermissions() {
    return await postgresService.query('SELECT * FROM permissions ORDER BY name')
  }

  async getUsersByRole(role: string) {
    return await postgresService.query(
      'SELECT * FROM profiles WHERE role = $1 AND deleted_at IS NULL',
      [role]
    )
  }
}

export const databaseService = new DatabaseService()

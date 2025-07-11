
import { postgresService } from './postgresService.ts';

export class DatabaseService {
  async getUserProfile(userId: string) {
    return await postgresService.getUserProfile(userId);
  }

  async getUserProfileByEmail(email: string) {
    return await postgresService.getUserProfileByEmail(email);
  }

  async getOrCreateUserProfile(email: string, fullName: string, authMethod: string = 'oauth') {
    return await postgresService.getOrCreateUserProfile(email, fullName, authMethod);
  }

  async verifyUserPassword(email: string, password: string) {
    return await postgresService.verifyUserPassword(email, password);
  }

  async createUserWithPassword(userId: string, email: string, fullName: string, hashedPassword: string, roleName: string) {
    return await postgresService.createUserWithPassword(userId, email, fullName, hashedPassword, roleName);
  }
}

export const databaseService = new DatabaseService();

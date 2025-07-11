
import { postgresService } from './postgresService.ts';
import { configService } from './configService.ts';

export class DatabaseService {
  constructor() {
    // Ensure config service is initialized
    configService.initialize();
  }

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

  async createUserWithPasswordInSchema(schema: string, userId: string, email: string, fullName: string, hashedPassword: string, roleName: string) {
    return await postgresService.createUserWithPasswordInSchema(schema, userId, email, fullName, hashedPassword, roleName);
  }

  // Get current schema info for debugging
  getCurrentSchemaInfo() {
    return configService.getSchemaInfo();
  }

  // Set tenant schema (if needed from this service)
  setTenantSchema(schema: string) {
    configService.setCurrentSchema(schema);
  }
}

export const databaseService = new DatabaseService();

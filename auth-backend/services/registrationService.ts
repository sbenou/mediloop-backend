
import { passwordService } from './passwordService.ts';
import { postgresService } from './postgresService.ts';

export class RegistrationService {
  async registerUser(email: string, password: string, fullName: string, role: string = 'patient', workplaceName?: string, pharmacyName?: string) {
    console.log('Starting registration for:', email, 'with role:', role);

    try {
      // Check if user already exists
      const existingUser = await this.checkExistingUser(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Generate user ID and hash password
      const userId = crypto.randomUUID();
      const hashedPassword = await passwordService.hashPassword(password);

      console.log('Creating user with ID:', userId);

      // Create user profile in public.profiles first
      const profile = await postgresService.createUserWithPassword(
        userId,
        email,
        fullName,
        hashedPassword,
        role
      );

      console.log('User profile created, now creating tenant');

      // Create tenant and tenant-specific tables
      const tenant = await postgresService.createTenant(
        userId,
        role,
        fullName,
        workplaceName,
        pharmacyName
      );

      console.log('Tenant created successfully:', tenant.id);

      // Return the profile with tenant_id
      return {
        ...profile,
        tenant_id: tenant.id
      };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  private async checkExistingUser(email: string) {
    try {
      const result = await postgresService.getUserProfileByEmail(email);
      return result;
    } catch (error) {
      // If user not found, that's what we want
      if (error.message.includes('Profile not found')) {
        return null;
      }
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();

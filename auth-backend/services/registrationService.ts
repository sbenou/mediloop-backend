
import { passwordService } from './passwordService.ts';
import { postgresService } from './postgresService.ts';

export class RegistrationService {
  async registerUser(email: string, password: string, fullName: string, role: string = 'patient', workplaceName?: string, pharmacyName?: string) {
    console.log('=== REGISTRATION START ===');
    console.log('Registration request for:', { email, role, fullName, workplaceName, pharmacyName });

    try {
      // Check if user already exists in public.profiles
      console.log('Step 1: Checking for existing user...');
      const existingUser = await this.checkExistingUser(email);
      if (existingUser) {
        console.log('ERROR: User already exists:', existingUser.id);
        throw new Error('User already exists with this email');
      }
      console.log('✓ No existing user found');

      // Generate user ID and hash password
      const userId = crypto.randomUUID();
      const hashedPassword = await passwordService.hashPassword(password);
      console.log('Step 2: Generated userId:', userId);

      // Ensure we're using public schema for initial user creation
      console.log('Step 3: Setting schema to public for user creation...');
      postgresService.setTenantSchema('public');
      console.log('Current schema after setting to public:', postgresService.getCurrentSchema());

      // Create user profile in public.profiles first
      console.log('Step 4: Creating user profile in public schema...');
      const profile = await postgresService.createUserWithPassword(
        userId,
        email,
        fullName,
        hashedPassword,
        role
      );
      console.log('✓ User profile created successfully:', profile.id);

      // Create tenant and tenant-specific tables
      console.log('Step 5: Creating tenant...');
      const tenant = await postgresService.createTenant(
        userId,
        role,
        fullName,
        workplaceName,
        pharmacyName
      );
      console.log('✓ Tenant created successfully:', { id: tenant.id, name: tenant.name, schema: tenant.schema });

      // Final result
      const result = {
        ...profile,
        tenant_id: tenant.id
      };
      console.log('=== REGISTRATION SUCCESS ===');
      console.log('Final result:', { userId: result.id, tenantId: result.tenant_id, email: result.email, role: result.role });
      
      return result;

    } catch (error) {
      console.error('=== REGISTRATION FAILED ===');
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  private async checkExistingUser(email: string) {
    try {
      console.log('Checking for existing user with email:', email);
      // Always check in public schema for existing users
      postgresService.setTenantSchema('public');
      const result = await postgresService.getUserProfileByEmail(email);
      console.log('Found existing user:', result.id);
      return result;
    } catch (error) {
      // If user not found, that's what we want
      if (error.message.includes('Profile not found')) {
        console.log('✓ No existing user found (as expected)');
        return null;
      }
      console.error('Error checking existing user:', error.message);
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();

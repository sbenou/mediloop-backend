
import { passwordService } from './passwordService.ts';
import { postgresService } from './postgresService.ts';

export class RegistrationService {
  async registerUser(email: string, password: string, fullName: string, role: string = 'patient', workplaceName?: string, pharmacyName?: string) {
    console.log('=== REGISTRATION START ===');
    console.log('Registration request for:', { email, role, fullName, workplaceName, pharmacyName });

    try {
      // Check if user already exists in any tenant schema
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

      // Create tenant FIRST
      console.log('Step 3: Creating tenant...');
      const tenant = await postgresService.createTenantForUser(
        userId,
        role,
        fullName,
        workplaceName,
        pharmacyName
      );
      console.log('✓ Tenant created successfully:', { id: tenant.id, name: tenant.name, schema: tenant.schema });

      // Create user profile directly in tenant schema with explicit schema parameter
      console.log('Step 4: Creating user profile in tenant schema:', tenant.schema);
      const profile = await postgresService.createUserWithPasswordInSchema(
        tenant.schema,
        userId,
        email,
        fullName,
        hashedPassword,
        role
      );
      console.log('✓ User profile created successfully:', profile.id);

      // Update tenant record with user association
      console.log('Step 5: Updating tenant record...');
      await postgresService.updateTenantWithUser(tenant.id, userId);
      console.log('✓ Tenant updated with user association');

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
      // Check in all tenant schemas for existing users
      const tenantSchemas = await postgresService.getAllTenantSchemas();
      console.log('Found tenant schemas:', tenantSchemas);
      
      for (const schema of tenantSchemas) {
        try {
          const result = await postgresService.getUserProfileByEmailInSchema(schema, email);
          if (result) {
            console.log('Found existing user in schema:', schema, 'user:', result.id);
            return result;
          }
        } catch (error) {
          // User not found in this schema, continue checking
          if (!error.message.includes('Profile not found')) {
            console.error('Error checking schema:', schema, error.message);
          }
        }
      }
      
      console.log('✓ No existing user found in any tenant schema');
      return null;
    } catch (error) {
      console.error('Error checking existing user:', error.message);
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();

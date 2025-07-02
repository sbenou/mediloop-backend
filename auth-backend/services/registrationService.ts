
import { databaseService } from "./databaseService.ts"
import { passwordService } from "./passwordService.ts"
import { postgresService } from "./postgresService.ts"
import { emailService } from "./emailService.ts"

export class RegistrationService {
  validateEmail(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const profile = await databaseService.getUserProfileByEmail(email);
      return !!profile;
    } catch (error) {
      // If error is "not found", email doesn't exist
      return false;
    }
  }

  async registerUser(email: string, password: string, fullName: string, role: string = 'patient', workplaceName?: string, pharmacyName?: string) {
    console.log('Registration attempt for:', email, 'with role:', role);

    // Validate email
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Check if email already exists
    const emailExists = await this.checkEmailExists(email);
    if (emailExists) {
      throw new Error('An account with this email already exists');
    }

    // Validate password strength
    const passwordValidation = passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user profile with hashed password
    const userId = crypto.randomUUID();
    const newProfile = await databaseService.createUserWithPassword(
      userId,
      email,
      fullName,
      hashedPassword,
      role
    );

    // Create tenant for the user (all users get their own tenant)
    await postgresService.createTenant(userId, role, fullName, workplaceName, pharmacyName);

    // Send welcome email
    const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/login`;
    await emailService.sendWelcomeEmail(email, fullName, role, loginUrl);

    console.log('User registered successfully:', userId);
    return newProfile;
  }

  async sendEmailConfirmation(email: string, confirmationUrl: string) {
    return await emailService.sendEmailConfirmation(email, confirmationUrl);
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    return await emailService.sendPasswordReset(email, resetUrl);
  }

  async sendLoginCode(email: string, code: string) {
    return await emailService.sendLoginCode(email, code);
  }
}

export const registrationService = new RegistrationService();

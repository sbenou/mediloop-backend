
import { databaseService } from "./databaseService.ts"
import { passwordService } from "./passwordService.ts"

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

  async registerUser(email: string, password: string, fullName: string, role: string = 'patient') {
    console.log('Registration attempt for:', email);

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

    console.log('User registered successfully:', userId);
    return newProfile;
  }
}

export const registrationService = new RegistrationService();

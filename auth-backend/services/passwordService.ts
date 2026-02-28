import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export class PasswordService {
  private readonly SALT_ROUNDS = 10; // bcrypt cost factor

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password);
  }

  /**
   * Verify a password against a bcrypt hash
   */
  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  /**
   * Validate password strength requirements
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const passwordService = new PasswordService();

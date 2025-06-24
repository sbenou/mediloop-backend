
export class PasswordService {
  private readonly SALT_LENGTH = 16;
  private readonly ITERATIONS = 100000; // PBKDF2 iterations

  async hashPassword(password: string): Promise<string> {
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // Derive key using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 32 bytes
    );

    // Combine salt and hash
    const hashArray = new Uint8Array(hashBuffer);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);

    // Return base64 encoded result
    return btoa(String.fromCharCode(...combined));
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      // Decode the stored hash
      const combined = new Uint8Array(
        atob(hashedPassword).split('').map(char => char.charCodeAt(0))
      );

      // Extract salt and hash
      const salt = combined.slice(0, this.SALT_LENGTH);
      const storedHash = combined.slice(this.SALT_LENGTH);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // Derive key using same parameters
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.ITERATIONS,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      const newHash = new Uint8Array(hashBuffer);

      // Compare hashes
      if (newHash.length !== storedHash.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < newHash.length; i++) {
        result |= newHash[i] ^ storedHash[i];
      }

      return result === 0;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const passwordService = new PasswordService();

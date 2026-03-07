/**
 * Input validation utilities for authentication
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format
 * Uses RFC 5322 compliant regex
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Basic email regex - RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check length
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one number
 * - At least one letter
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: 'Password is too long (max 128 characters)',
    };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one letter',
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }

  return { valid: true };
}

/**
 * Validate full name
 */
export function validateFullName(fullName: string): ValidationResult {
  if (!fullName || typeof fullName !== 'string') {
    return { valid: false, error: 'Full name is required' };
  }

  const trimmed = fullName.trim();
  
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Full name must be at least 2 characters long',
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Full name is too long (max 100 characters)',
    };
  }

  return { valid: true };
}

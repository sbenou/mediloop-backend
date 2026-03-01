/**
 * Authentication Client V2
 * Enhanced client with password reset, session refresh, and rate limiting support
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: {
      id: string;
      email: string;
      fullName: string;
      phone?: string;
    };
    accessToken?: string;
    refreshToken?: string;
  };
  error?: string;
}

export interface RateLimitError extends Error {
  isRateLimit: true;
  retryAfter?: number; // seconds
}

/**
 * Enhanced fetch wrapper with rate limit handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const data = await response.json().catch(() => ({}));

    const error = new Error(
      data.message || "Too many requests. Please try again later.",
    ) as RateLimitError;
    error.isRateLimit = true;
    error.retryAfter = retryAfter ? parseInt(retryAfter, 10) : 60;

    throw error;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data as T;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    error instanceof Error &&
    "isRateLimit" in error &&
    (error as RateLimitError).isRateLimit === true
  );
}

export const authClientV2 = {
  /**
   * Request password reset via OTP (SMS)
   */
  async requestPasswordResetOTP(phone: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/request-password-reset-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  /**
   * Reset password using OTP code
   */
  async resetPasswordWithOTP(
    phone: string,
    otp: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/reset-password-with-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp, newPassword }),
    });
  },

  /**
   * Request password reset via email link
   */
  async requestPasswordResetLink(email: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/request-password-reset-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password using email token
   */
  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/reset-password-with-token", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  /**
   * Login
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Register
   */
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },
};

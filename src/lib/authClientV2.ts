/**
 * Authentication Client V2
 * Enhanced client with password reset, session refresh, and rate limiting support
 */

import {
  clearV2SessionStorageKeys,
  persistV2SessionFromBackendLogin,
} from "@/lib/auth/v2SessionStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

// ✅ Backend response format (matches actual Deno backend)
export interface BackendAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  session_id: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    tenant_id: string;
  };
  error?: string;
}

// ✅ Frontend normalized format (for compatibility)
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
 * Normalize backend response to frontend format
 */
function normalizeBackendResponse(
  backendResponse: BackendAuthResponse,
): AuthResponse {
  return {
    success: true,
    message: "Success",
    data: {
      accessToken: backendResponse.access_token,
      refreshToken: backendResponse.access_token, // Backend doesn't have separate refresh token yet
      user: {
        id: backendResponse.user.id,
        email: backendResponse.user.email,
        fullName: backendResponse.user.full_name,
      },
    },
  };
}

/**
 * Store auth tokens in both legacy and V2 formats for compatibility
 */
function storeAuthTokens(data: AuthResponse["data"]): void {
  if (!data || !data.accessToken || !data.user) {
    console.warn("[authClientV2] Cannot store tokens - missing data", data);
    return;
  }

  // ✅ Store in LEGACY format (for backward compatibility)
  localStorage.setItem("auth_token", data.accessToken);

  // ✅ Store in V2 format (for new auth system)
  const v2Session = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || data.accessToken, // Use refreshToken if available
    userId: data.user.id,
    timestamp: Date.now(),
  };
  localStorage.setItem("mediloop_session_sync", JSON.stringify(v2Session));

  // ✅ Store user data separately for V2 system
  localStorage.setItem("mediloop_v2_user", JSON.stringify(data.user));

  persistV2SessionFromBackendLogin({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    userId: data.user.id,
  });

  console.log("✅ [authClientV2] Tokens stored in both legacy and V2 format", {
    userId: data.user.id,
    email: data.user.email,
  });
}

/**
 * Clear all auth tokens from storage
 */
function clearAuthTokens(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("mediloop_session_sync");
  localStorage.removeItem("mediloop_v2_user");
  clearV2SessionStorageKeys();
  console.log("✅ [authClientV2] All auth tokens cleared");
}

/**
 * Enhanced fetch wrapper with rate limit handling and response normalization
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
    const backendResponse = await apiFetch<BackendAuthResponse>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    // ✅ Normalize backend response
    const response = normalizeBackendResponse(backendResponse);

    // ✅ Store tokens after successful login
    if (response.success && response.data) {
      storeAuthTokens(response.data);
    }

    return response;
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
    const backendResponse = await apiFetch<BackendAuthResponse>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    // ✅ Normalize backend response
    const response = normalizeBackendResponse(backendResponse);

    // ✅ Store tokens after successful registration
    if (response.success && response.data) {
      storeAuthTokens(response.data);
    }

    return response;
  },

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    // ✅ Clear tokens after successful logout
    if (response.success) {
      clearAuthTokens();
    }

    return response;
  },
};

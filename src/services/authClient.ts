import {
  clearV2SessionStorageKeys,
  persistV2SessionFromBackendLogin,
} from "@/lib/auth/v2SessionStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  session_id: string;
  user: {
    id: string;
    email: string;
    role: string;
    full_name: string;
    tenant_id?: string;
  };
}

interface RegisterResponse extends LoginResponse {}

interface TokenVerification {
  valid: boolean;
  payload?: {
    sub: string;
    email: string;
    role: string;
    tenant_id?: string;
  };
}

class AuthClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem("auth_token");
  }

  /**
   * Store tokens in BOTH legacy and V2 formats for compatibility
   */
  private storeTokens(data: LoginResponse | RegisterResponse): void {
    this.token = data.access_token;

    // ✅ Store in LEGACY format (for backward compatibility)
    localStorage.setItem("auth_token", this.token);

    // ✅ Store in V2 format (for new auth system)
    const v2Session = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || data.access_token, // Use refresh_token if available
      userId: data.user.id,
      timestamp: Date.now(),
    };
    localStorage.setItem("mediloop_session_sync", JSON.stringify(v2Session));

    // ✅ Also store user data separately for V2 system
    localStorage.setItem("mediloop_v2_user", JSON.stringify(data.user));

    persistV2SessionFromBackendLogin({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user.id,
    });

    console.log("✅ Tokens stored in both legacy and V2 format");
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data: LoginResponse = await response.json();
    this.storeTokens(data); // ✅ Use new storage method
    return data;
  }

  async register(
    email: string,
    password: string,
    fullName: string,
    role: string = "patient",
  ): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const data: RegisterResponse = await response.json();
    this.storeTokens(data); // ✅ Use new storage method
    return data;
  }

  async testProtectedRoute(): Promise<any> {
    if (!this.token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${API_BASE_URL}/api/protected`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Protected route access failed");
    }

    return await response.json();
  }

  async getProfile(): Promise<any> {
    if (!this.token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Profile fetch failed");
    }

    return await response.json();
  }

  // OAuth methods
  initiateGoogleAuth(): void {
    window.location.href = `${API_BASE_URL}/api/oauth/google`;
  }

  initiateFranceConnectAuth(): void {
    window.location.href = `${API_BASE_URL}/api/oauth/franceconnect`;
  }

  handleOAuthCallback(token: string): void {
    this.token = token;
    localStorage.setItem("auth_token", token);
    // Note: OAuth callback should ideally provide full user data to use storeTokens()
  }

  async verifyToken(): Promise<TokenVerification> {
    if (!this.token) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: true,
        payload: data.payload,
      };
    } catch (error) {
      return { valid: false };
    }
  }

  logout(): void {
    this.token = null;

    // ✅ Clear BOTH legacy and V2 storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("mediloop_session_sync");
    localStorage.removeItem("mediloop_v2_user");
    clearV2SessionStorageKeys();

    console.log("✅ Logged out - cleared all auth data");
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authClient = new AuthClient();

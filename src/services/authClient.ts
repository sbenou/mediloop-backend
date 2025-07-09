
const API_BASE_URL = 'http://localhost:8000';

interface LoginResponse {
  access_token: string;
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
    this.token = localStorage.getItem('auth_token');
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    this.token = data.access_token;
    localStorage.setItem('auth_token', this.token);
    return data;
  }

  async register(email: string, password: string, fullName: string, role: string = 'patient'): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: RegisterResponse = await response.json();
    this.token = data.access_token;
    localStorage.setItem('auth_token', this.token);
    return data;
  }

  async testProtectedRoute(): Promise<any> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/protected`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Protected route access failed');
    }

    return await response.json();
  }

  async getProfile(): Promise<any> {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Profile fetch failed');
    }

    return await response.json();
  }

  // OAuth methods
  initiateGoogleAuth(): void {
    window.location.href = `${API_BASE_URL}/oauth/google`;
  }

  initiateFranceConnectAuth(): void {
    window.location.href = `${API_BASE_URL}/oauth/franceconnect`;
  }

  handleOAuthCallback(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  async verifyToken(): Promise<TokenVerification> {
    if (!this.token) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: true,
        payload: data.payload
      };
    } catch (error) {
      return { valid: false };
    }
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authClient = new AuthClient();

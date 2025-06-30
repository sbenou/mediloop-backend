
interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email: string
    role: string
    full_name: string
  }
}

interface AuthError {
  error: string
}

class AuthClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    // Use Vite's environment variable system for the frontend
    // This will use VITE_AUTH_BACKEND_URL from environment or fall back to localhost
    this.baseUrl = import.meta.env.VITE_AUTH_BACKEND_URL || 'http://localhost:8000'
    
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token')
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    if (this.token && !endpoint.includes('/oauth/')) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    console.log('AuthClient: Making request to:', url)

    const response = await fetch(url, {
      ...options,
      headers
    })

    console.log('AuthClient: Response status:', response.status)

    if (!response.ok) {
      let errorMessage = 'Request failed'
      try {
        const errorData = await response.json() as AuthError
        errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  async register(email: string, password: string, fullName: string, role: string = 'patient'): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role })
    })

    this.token = response.access_token
    localStorage.setItem('auth_token', this.token)
    
    return response
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    this.token = response.access_token
    localStorage.setItem('auth_token', this.token)
    
    return response
  }

  async refreshToken(): Promise<AuthResponse> {
    if (!this.token) {
      throw new Error('No token to refresh')
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: this.token })
    })

    this.token = response.access_token
    localStorage.setItem('auth_token', this.token)
    
    return response
  }

  async verifyToken(): Promise<{ valid: boolean; payload?: any }> {
    if (!this.token) {
      return { valid: false }
    }

    try {
      const response = await this.request<{ valid: boolean; payload: any }>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: this.token })
      })
      
      return response
    } catch (error) {
      console.error('Token verification failed:', error)
      return { valid: false }
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      })
    } finally {
      this.token = null
      localStorage.removeItem('auth_token')
    }
  }

  async getUserProfile(): Promise<any> {
    return this.request('/auth/profile')
  }

  // OAuth methods - will point to your deployed backend
  initiateGoogleAuth(): void {
    window.location.href = `${this.baseUrl}/oauth/google`
  }

  initiateFranceConnectAuth(): void {
    window.location.href = `${this.baseUrl}/oauth/franceconnect`
  }

  initiateLuxTrustAuth(): void {
    console.log('LuxTrust authentication should be handled by the useLuxTrustAuth hook')
  }

  // Handle OAuth callback
  handleOAuthCallback(token: string): void {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string): void {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken(): void {
    this.token = null
    localStorage.removeItem('auth_token')
  }
}

export const authClient = new AuthClient()
export type { AuthResponse, AuthError }

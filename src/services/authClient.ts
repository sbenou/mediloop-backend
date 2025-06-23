
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
    // Use the correct Supabase Functions URL format
    this.baseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co/functions/v1/auth-service'
    
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

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/login', {
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

    const response = await this.request<AuthResponse>('/refresh', {
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
      const response = await this.request<{ valid: boolean; payload: any }>('/verify', {
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
      await this.request('/logout', {
        method: 'POST'
      })
    } finally {
      this.token = null
      localStorage.removeItem('auth_token')
    }
  }

  async getUserProfile(): Promise<any> {
    return this.request('/user/profile')
  }

  // OAuth methods
  initiateGoogleAuth(): void {
    window.location.href = `${this.baseUrl}/oauth/google`
  }

  initiateFranceConnectAuth(): void {
    window.location.href = `${this.baseUrl}/oauth/franceconnect`
  }

  initiateLuxTrustAuth(): void {
    // For LuxTrust, we use the separate luxtrust-service for the authentication flow
    // The authClient mainly handles the OAuth callback and token management
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

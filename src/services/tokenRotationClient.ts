
const API_BASE_URL = 'http://localhost:8000';

interface RotatedTokenResponse {
  hasRotatedToken: boolean;
  token?: string;
  expiresAt?: string;
  rotatedAt?: string;
}

class TokenRotationClient {
  private checkInterval: number | null = null;
  private onTokenRotated?: (newToken: string, expiresAt: string) => void;

  // Start polling for rotated tokens
  startPolling(onTokenRotated: (newToken: string, expiresAt: string) => void) {
    this.onTokenRotated = onTokenRotated;
    
    // Check every 30 seconds for rotated tokens
    this.checkInterval = window.setInterval(() => {
      this.checkForRotatedToken();
    }, 30000);
    
    console.log('[TokenRotation] Started polling for rotated tokens');
  }

  // Stop polling
  stopPolling() {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.onTokenRotated = undefined;
    console.log('[TokenRotation] Stopped polling for rotated tokens');
  }

  // Check if a new token is available
  private async checkForRotatedToken() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/rotated-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const data: RotatedTokenResponse = await response.json();
      
      if (data.hasRotatedToken && data.token && data.expiresAt) {
        console.log('[TokenRotation] New token received via automatic rotation');
        
        // Update stored token
        localStorage.setItem('auth_token', data.token);
        
        // Notify callback
        if (this.onTokenRotated) {
          this.onTokenRotated(data.token, data.expiresAt);
        }
      }
    } catch (error) {
      console.error('[TokenRotation] Error checking for rotated token:', error);
    }
  }

  // Manual check (for testing)
  async checkNow(): Promise<RotatedTokenResponse | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/rotated-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('[TokenRotation] Error in manual check:', error);
      return null;
    }
  }
}

export const tokenRotationClient = new TokenRotationClient();

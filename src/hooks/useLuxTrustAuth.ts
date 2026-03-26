import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);

  const authenticateWithLuxTrust = async (): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);

    try {
      console.log('Starting LuxTrust authentication (Deno API)...');

      const res = await fetch(`${API_BASE}/api/luxtrust/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auth',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = (await res.json()) as LuxTrustAuthResponse & { error?: string };

      if (!res.ok) {
        console.error('LuxTrust API error:', res.status, data);
        toast({
          title: 'LuxTrust Error',
          description: data?.error || `HTTP ${res.status}`,
          variant: 'destructive',
        });
        return null;
      }

      if (data?.success) {
        console.log('LuxTrust authentication successful:', data);
        setAuthResponse(data);
        toast({
          title: 'LuxTrust Success',
          description: 'Authentication completed successfully!',
          variant: 'default',
        });
        return data;
      }

      console.error('LuxTrust authentication failed:', data);
      toast({
        title: 'LuxTrust Failed',
        description: 'Authentication was not successful',
        variant: 'destructive',
      });
      return null;
    } catch (error) {
      console.error('LuxTrust authentication failed:', error);
      toast({
        title: 'LuxTrust Error',
        description: 'Failed to connect to authentication service',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const clearAuth = () => {
    setAuthResponse(null);
  };

  return {
    authenticateWithLuxTrust,
    clearAuth,
    isAuthenticating,
    authResponse,
    isAuthenticated: !!authResponse?.success,
  };
};

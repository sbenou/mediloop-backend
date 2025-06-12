
import { useState } from 'react';
import { authClient } from '@/services/authClient';

interface LoginState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

export const usePasswordLoginV2 = () => {
  const [state, setState] = useState<LoginState>({
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const login = async (email: string, password: string) => {
    setState({ isLoading: true, error: null, isSuccess: false });
    
    try {
      console.log('V2 Login: Attempting login with JWT auth service');
      const response = await authClient.login(email, password);
      
      console.log('V2 Login: Login successful', { 
        user: response.user,
        tokenExists: !!response.access_token 
      });
      
      setState({ isLoading: false, error: null, isSuccess: true });
      
      // Redirect to dashboard or trigger app-wide auth state update
      window.location.href = '/dashboard';
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('V2 Login: Login failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState({ isLoading: false, error: errorMessage, isSuccess: false });
      return { success: false, error: errorMessage };
    }
  };

  const resetState = () => {
    setState({ isLoading: false, error: null, isSuccess: false });
  };

  return {
    ...state,
    login,
    resetState,
  };
};

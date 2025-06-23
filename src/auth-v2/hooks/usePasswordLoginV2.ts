
import { useState } from 'react';
import { authClient } from '@/services/authClient';
import { toast } from '@/components/ui/use-toast';

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
      
      // Show success message
      toast({
        title: 'Login successful',
        description: 'Welcome back!'
      });
      
      // Redirect to dashboard or trigger app-wide auth state update
      window.location.href = '/dashboard';
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('V2 Login: Login failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      // Show more helpful error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('No account found with this email address')) {
        userFriendlyMessage = 'No account found with this email address. Please sign up first or check your email address.';
      } else if (errorMessage.includes('Invalid email or password')) {
        userFriendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('Please confirm your email')) {
        userFriendlyMessage = 'Please check your email and confirm your account before signing in.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: userFriendlyMessage
      });
      
      setState({ isLoading: false, error: userFriendlyMessage, isSuccess: false });
      return { success: false, error: userFriendlyMessage };
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

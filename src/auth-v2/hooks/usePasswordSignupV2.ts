
import { useState } from 'react';
import { authClient } from '@/services/authClient';
import { toast } from '@/components/ui/use-toast';

interface SignupState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

export const usePasswordSignupV2 = () => {
  const [state, setState] = useState<SignupState>({
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const signup = async (email: string, password: string, fullName: string, role: string = 'patient') => {
    setState({ isLoading: true, error: null, isSuccess: false });
    
    try {
      console.log('V2 Signup: Attempting registration with JWT auth service');
      const response = await authClient.register(email, password, fullName, role);
      
      console.log('V2 Signup: Registration successful', { 
        user: response.user,
        tokenExists: !!response.access_token 
      });
      
      setState({ isLoading: false, error: null, isSuccess: true });
      
      // Show success message
      toast({
        title: 'Registration successful',
        description: 'Welcome! Your account has been created.'
      });
      
      // Redirect to dashboard or trigger app-wide auth state update
      window.location.href = '/dashboard';
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('V2 Signup: Registration failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      // Show more helpful error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('An account with this email already exists')) {
        userFriendlyMessage = 'An account with this email already exists. Please use a different email or try logging in.';
      } else if (errorMessage.includes('Password must')) {
        userFriendlyMessage = errorMessage; // Password validation messages are already user-friendly
      } else if (errorMessage.includes('Invalid email format')) {
        userFriendlyMessage = 'Please enter a valid email address.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Registration failed',
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
    signup,
    resetState,
  };
};

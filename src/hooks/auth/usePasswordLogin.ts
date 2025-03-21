
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { storeSession } from "@/lib/auth/sessionUtils";

interface UsePasswordLoginProps {
  email: string;
  onSuccess: () => void;
}

export const usePasswordLogin = ({ email, onSuccess }: UsePasswordLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (password: string, rememberMe: boolean = true) => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing credentials",
        description: "Please provide both email and password",
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting login process...', { email, rememberMe });

    try {
      // Clear any existing sessions to prevent conflicts
      try {
        const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (clearError) {
        console.error('Error clearing existing session:', clearError);
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Set longer expiry for remember me
          expiresIn: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days vs 1 day
        }
      });

      if (error) {
        handleLoginError(error);
        return;
      }

      if (!data.session || !data.user) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "We couldn't authenticate you. Please try again.",
        });
        return;
      }

      console.log('Sign in successful:', data.user.id);
      
      // Ensure session is stored with maximum reliability
      storeSession(data.session);
      
      // Verify that the session is valid by making a simple request
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          throw new Error('Session validation failed');
        }
        
        console.log('Session validation successful');
      } catch (validationError) {
        console.error('Error validating session:', validationError);
        // Continue anyway, the onSuccess handler will check again
      }

      setIsLoading(false);
      
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully.",
      });
      
      // Call success handler to trigger redirect
      onSuccess();
      
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleLoginError = (error: any) => {
    console.error('Login error:', error);
    
    let errorMessage = "Invalid email or password. Please try again.";
    
    if (error.message.includes('Email not confirmed')) {
      errorMessage = "Please confirm your email address before logging in. Check your inbox for a confirmation link.";
    } else if (error.message.includes('Invalid login credentials')) {
      errorMessage = "Invalid email or password. Please check your credentials and try again.";
    } else if (error.status === 429 || error.message.includes('Too many requests')) {
      errorMessage = "Too many login attempts. Please try again later.";
    }
    
    toast({
      variant: "destructive",
      title: "Login Failed",
      description: errorMessage,
    });
    
    setIsLoading(false);
  };

  return {
    isLoading,
    handleLogin
  };
};


import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { getDashboardRouteByRole } from '@/utils/auth/getDashboardRouteByRole';

interface UsePasswordLoginResult {
  isLoading: boolean;
  error: AuthError | null;
  handleLogin: (password: string, rememberMe: boolean) => Promise<void>;
}

interface UsePasswordLoginProps {
  email: string;
  onSuccess?: () => void;
}

export const usePasswordLogin = ({ email, onSuccess }: UsePasswordLoginProps): UsePasswordLoginResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();

  const handleLogin = useCallback(async (password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    setError(null);
    console.log(`[usePasswordLogin] Attempting login for email: ${email}`);

    // Create a login timeout to prevent hanging
    const loginTimeoutId = setTimeout(() => {
      console.error('[usePasswordLogin] Login process timed out after 15 seconds');
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login timed out",
        description: "The login process took too long. Please try again.",
      });
    }, 15000);

    try {
      // 1. Authentication step
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // Clear timeout as soon as we get a response
      clearTimeout(loginTimeoutId);

      if (authError) {
        console.error('[usePasswordLogin] Auth error:', authError);
        setError(authError);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: authError.message || "Invalid email or password",
        });
        setIsLoading(false);
        return;
      }

      if (!data?.session) {
        console.error('[usePasswordLogin] No session data returned');
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Unable to establish a session. Please try again.",
        });
        setIsLoading(false);
        return;
      }
        
      // 2. Success notification
      toast({
        title: "Login successful",
        description: "You've been logged in successfully",
      });

      // 3. Get user role from metadata or default to patient
      const userRole = data.user.user_metadata?.role || 'patient';
      
      // 4. Create minimal profile with defaults (actual profile will be fetched by AuthProvider)
      const minimalProfile = {
        id: data.user.id,
        role: userRole,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || null,
      };

      // 5. Update auth state with minimal profile
      setAuth({
        user: data.user,
        profile: minimalProfile,
        permissions: [],
        isLoading: false,
      });
      
      // 6. Invoke success callback
      if (onSuccess) {
        onSuccess();
      }

      // 7. Cleanup
      setIsLoading(false);
      
      // 8. Role-based redirection
      const dashboardRoute = getDashboardRouteByRole(userRole);
      console.log(`[usePasswordLogin] Redirecting user with role ${userRole} to: ${dashboardRoute}`);
      
      navigate(dashboardRoute, { 
        replace: true,
        state: { preserveAuth: true }
      });
      
    } catch (err: any) {
      clearTimeout(loginTimeoutId);
      console.error('[usePasswordLogin] Unexpected error during login:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message || "An unexpected error occurred",
      });
      setIsLoading(false);
    }
  }, [email, setAuth, toast, onSuccess, navigate]);

  return { isLoading, error, handleLogin };
};

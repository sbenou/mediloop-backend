
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { storeSession } from '@/lib/auth/sessionUtils';
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

    // Global timeout to prevent hanging
    const loginTimeout = setTimeout(() => {
      console.error('[usePasswordLogin] Login process timed out after 15 seconds');
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login timed out",
        description: "The login process took too long. Please try again.",
        duration: 5000,
      });
    }, 15000);

    try {
      // 1. Authentication step
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error('[usePasswordLogin] Auth error:', authError);
        setError(authError);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: authError.message,
          duration: 5000,
        });
        setIsLoading(false);
        clearTimeout(loginTimeout);
        return;
      }

      if (!data?.session) {
        console.error('[usePasswordLogin] No session data returned');
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Unable to establish a session. Please try again.",
          duration: 5000,
        });
        setIsLoading(false);
        clearTimeout(loginTimeout);
        return;
      }
        
      // 2. Store the session
      storeSession(data.session);
      console.log("[usePasswordLogin] Login successful, session stored");
      
      // 3. Success notification
      toast({
        title: "Login successful",
        description: "You've been logged in successfully",
        duration: 3000,
      });

      // 4. Create minimal profile with defaults
      const minimalProfile = {
        id: data.user.id,
        role: data.user.user_metadata?.role || 'patient',
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 'User',
        role_id: null,
        avatar_url: null,
        date_of_birth: null,
        city: null,
        auth_method: 'password',
        is_blocked: false,
        doctor_stamp_url: null,
        doctor_signature_url: null,
        pharmacist_stamp_url: null,
        pharmacist_signature_url: null,
        cns_card_front: null,
        cns_card_back: null,
        cns_number: null,
        deleted_at: null,
        created_at: null,
        updated_at: null,
        license_number: data.user.user_metadata?.license_number || null,
        phone_number: null,
        address: null,
        pharmacy_id: null,
        pharmacy_name: null,
        pharmacy_logo_url: null
      };

      // 5. Update auth state with minimal profile to ensure we can navigate immediately
      setAuth({
        user: data.user,
        profile: minimalProfile,
        permissions: [],
        isLoading: false,
      });
      
      // 6. Determine redirect route
      const role = minimalProfile.role || 'patient';
      const redirectRoute = getDashboardRouteByRole(role);
      console.log("[usePasswordLogin] Redirecting to:", redirectRoute);
      
      // 7. Invoke success callback
      if (onSuccess) {
        onSuccess();
      }

      // 8. Cleanup and navigate
      setIsLoading(false);
      clearTimeout(loginTimeout);
      
      // 9. Immediate navigation with fallback - if for some reason navigation fails, force reload
      const navigateSuccess = navigate(redirectRoute, { replace: true });
      
      // Set a fallback in case navigate doesn't work
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/login') {
          console.log('[usePasswordLogin] Fallback navigation triggered - forcing page reload to dashboard');
          window.location.href = redirectRoute;
        }
      }, 1500);
    } catch (err: any) {
      clearTimeout(loginTimeout);
      console.error('[usePasswordLogin] Unexpected error during login:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message || "An unexpected error occurred",
        duration: 5000,
      });
      setIsLoading(false);
    }
  }, [email, setAuth, toast, onSuccess, navigate]);

  return { isLoading, error, handleLogin };
};


import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast"
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
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);

  const handleLogin = useCallback(async (password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    setError(null);
    console.log(`[usePasswordLogin] Attempting login for email: ${email}`, { rememberMe });

    try {
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
        });
        return;
      }

      if (data?.session) {
        console.log("[usePasswordLogin] Login successful, storing session");
        // Store the session immediately after login
        storeSession(data.session);

        console.log("[usePasswordLogin] Fetching user profile");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user?.id)
          .maybeSingle();

        if (profileError) {
          console.error("[usePasswordLogin] Profile fetch error:", profileError);
          toast({
            variant: "destructive",
            title: "Profile Error",
            description: "There was an error loading your profile. Please try again.",
          });
        }
        
        // Even if we can't fetch the profile, continue with login
        // The user object is sufficient for authentication
        const completeProfile = profile ? {
          ...profile as any,
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null
        } : null;

        // Set auth state
        setAuth({
          user: data.user,
          profile: completeProfile,
          permissions: [],
          isLoading: false,
        });

        toast({
          title: "Login successful",
          description: "You have successfully logged in.",
        });
        
        // Set login_successful flag
        sessionStorage.setItem('login_successful', 'true');

        // Call onSuccess callback if provided, otherwise navigate
        if (onSuccess) {
          onSuccess();
        } else {
          // For pharmacists, use direct URL navigation for reliable routing with parameters
          if (profile?.role === 'pharmacist') {
            window.location.href = '/dashboard?view=pharmacy&section=dashboard';
            return;
          }
          
          // Determine where to navigate based on role
          const role = completeProfile?.role || 'user';
          const route = getDashboardRouteByRole(role);
          navigate(route, { replace: true });
        }
      }
    } catch (err: any) {
      console.error('[usePasswordLogin] Unexpected error during login:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, navigate, setAuth, toast, onSuccess]);

  return { isLoading, error, handleLogin };
};

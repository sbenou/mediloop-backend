
import { useState, useCallback } from 'react';
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

  const handleLogin = useCallback(async (password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    setError(null);
    console.log(`[usePasswordLogin] Attempting login for email: ${email}`);

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
        
        const completeProfile = profile ? {
          ...profile as any,
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null
        } : null;

        // Update auth state
        setAuth({
          user: data.user,
          profile: completeProfile,
          permissions: [],
          isLoading: false,
        });
        
        // Show success toast
        toast({
          title: "Login successful",
          description: "You've been logged in successfully",
        });
        
        // Set flags for redirecting
        sessionStorage.setItem('login_successful', 'true');
        
        // Log role detection for debugging
        console.log("[usePasswordLogin] Role detected:", completeProfile?.role || 'No role');
        
        // Determine the redirect route based on role
        const role = completeProfile?.role || 'patient';
        const redirectRoute = getDashboardRouteByRole(role);
        console.log("[usePasswordLogin] Redirecting to:", redirectRoute);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Use direct URL navigation for the most reliable redirection
        window.location.href = redirectRoute;
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
  }, [email, setAuth, toast, onSuccess]);

  return { isLoading, error, handleLogin };
};

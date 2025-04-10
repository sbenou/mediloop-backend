
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast"
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { storeSession } from '@/lib/auth/sessionUtils';
import { getDashboardRouteByRole } from '@/utils/auth/getDashboardRouteByRole';

interface LoginResult {
  loading: boolean;
  error: AuthError | null;
  login: (password: string) => Promise<void>;
}

// Update this interface to match what PasswordFields expects
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
    console.log(`[usePasswordLogin][DEBUG] Attempting login for email: ${email}`, { rememberMe });

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error('[usePasswordLogin][DEBUG] Auth error:', authError);
        setError(authError);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: authError.message,
        });
        return;
      }

      if (data?.session) {
        console.log("[usePasswordLogin][DEBUG] Login successful, storing session");
        // Store the session immediately after login - this will also set the login_successful flag
        storeSession(data.session);

        console.log("[usePasswordLogin][DEBUG] Fetching user profile");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user?.id)
          .maybeSingle();

        if (profileError) {
          console.error("[usePasswordLogin][DEBUG] Profile fetch error:", profileError);
          
          // More resilient error handling - try again with a more limited query
          console.log("[usePasswordLogin][DEBUG] Retrying profile fetch with limited fields");
          const { data: limitedProfile, error: limitedProfileError } = await supabase
            .from('profiles')
            .select('id, role, full_name, email')
            .eq('id', data.user?.id)
            .maybeSingle();
            
          if (limitedProfileError || !limitedProfile) {
            console.error("[usePasswordLogin][DEBUG] Second profile fetch attempt failed:", limitedProfileError);
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Failed to fetch user profile. Please try again.",
            });
            return;
          }
          
          // If we got a limited profile, use that
          console.log(`[usePasswordLogin][DEBUG] Limited profile fetched successfully, role: ${limitedProfile?.role}`);
          profile = limitedProfile;
        }

        if (!profile) {
          console.error("[usePasswordLogin][DEBUG] No profile found for user:", data.user?.id);
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "User profile not found. Please contact support.",
          });
          return;
        }

        console.log(`[usePasswordLogin][DEBUG] Profile fetched successfully, role: ${profile?.role}`, profile);

        const completeProfile = {
          ...profile as any,
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null
        };

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
        
        // Set flags to ensure proper navigation
        sessionStorage.setItem('login_successful', 'true');
        sessionStorage.setItem('skip_dashboard_redirect', 'true');
        
        // Clear any previous redirect counters
        sessionStorage.removeItem('dashboard_redirect_count');
        sessionStorage.removeItem('dashboard_mount_count');
        sessionStorage.removeItem('pharmacy_redirect_count');

        // Special handling for pharmacists to ensure correct dashboard loading
        if (profile?.role === 'pharmacist') {
          console.log('[usePasswordLogin][DEBUG] Pharmacist login detected, using direct navigation');
          console.log('[usePasswordLogin][DEBUG] Pharmacist target URL: /dashboard?view=pharmacy&section=dashboard');
          
          // Force a small delay to ensure the session is properly stored
          setTimeout(() => {
            // Use direct navigation for pharmacists
            window.location.href = '/dashboard?view=pharmacy&section=dashboard';
          }, 300);
          return;
        }

        // For other roles, proceed with normal flow
        if (onSuccess) {
          console.log('[usePasswordLogin][DEBUG] Calling onSuccess callback');
          onSuccess();
        } else {
          // If no success callback, redirect directly to the appropriate dashboard
          try {
            const route = getDashboardRouteByRole(profile?.role);
            console.log(`[usePasswordLogin][DEBUG] No success callback, redirecting to: ${route}`);
            
            // Force a small delay to ensure the session is properly stored
            setTimeout(() => {
              window.location.href = route;
            }, 300);
          } catch (navErr) {
            console.error('[usePasswordLogin][DEBUG] Navigation error:', navErr);
            setTimeout(() => {
              window.location.href = '/';
            }, 300);
          }
        }
      } else {
        console.error('[usePasswordLogin][DEBUG] No session data returned from login');
      }
    } catch (err: any) {
      console.error('[usePasswordLogin][DEBUG] Unexpected error during login:', err);
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

// Keep the old export for backward compatibility
export const usePasswordLoginLegacy = (email: string): LoginResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);

  const login = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        setError(authError);
        toast({
          variant: "destructive",
          title: "Login failed",
          description: authError.message,
        });
        return;
      }

      if (data?.session) {
        // Store the session immediately after login
        storeSession(data.session);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user?.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Failed to fetch user profile.",
          });
          return;
        }

        const completeProfile = {
          ...profile as any,
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null
        };

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

        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [email, navigate, setAuth, toast]);

  return { loading, error, login };
};


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
        // Use a let declaration for userProfile so we can reassign it later if needed
        let userProfile;
        
        // First attempt: try full profile fetch
        try {
          const { data: fullProfile, error: fullProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .maybeSingle();
            
          if (!fullProfileError && fullProfile) {
            userProfile = fullProfile;
            console.log("[usePasswordLogin][DEBUG] Full profile fetch successful");
          } else {
            console.error("[usePasswordLogin][DEBUG] Full profile fetch error:", fullProfileError);
          }
        } catch (e) {
          console.error("[usePasswordLogin][DEBUG] Error during full profile fetch:", e);
        }
        
        // Second attempt: if full profile fetch failed, try with limited fields
        if (!userProfile) {
          console.log("[usePasswordLogin][DEBUG] Retrying profile fetch with limited fields");
          try {
            const { data: limitedProfile, error: limitedProfileError } = await supabase
              .from('profiles')
              .select(`
                id, role, role_id, full_name, email, 
                avatar_url, auth_method, is_blocked, 
                city, date_of_birth, license_number,
                deleted_at, created_at, updated_at,
                pharmacist_stamp_url, pharmacist_signature_url,
                doctor_stamp_url, doctor_signature_url
              `)
              .eq('id', data.user?.id)
              .maybeSingle();
              
            if (limitedProfileError) {
              console.error("[usePasswordLogin][DEBUG] Limited profile fetch error:", limitedProfileError);
            } else if (limitedProfile) {
              userProfile = limitedProfile;
              console.log("[usePasswordLogin][DEBUG] Limited profile fetch successful");
            }
          } catch (e) {
            console.error("[usePasswordLogin][DEBUG] Error during limited profile fetch:", e);
          }
        }

        if (!userProfile) {
          console.error("[usePasswordLogin][DEBUG] No profile found for user:", data.user?.id);
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "User profile not found. Please contact support.",
          });
          return;
        }

        console.log(`[usePasswordLogin][DEBUG] Profile fetched successfully, role: ${userProfile?.role}`, userProfile);

        const completeProfile = {
          ...userProfile,
          pharmacist_stamp_url: userProfile.pharmacist_stamp_url || null,
          pharmacist_signature_url: userProfile.pharmacist_signature_url || null,
          pharmacy_id: userProfile.pharmacy_id || null,
          pharmacy_name: userProfile.pharmacy_name || null,
          pharmacy_logo_url: userProfile.pharmacy_logo_url || null
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
        if (userProfile?.role === 'pharmacist') {
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
            const route = getDashboardRouteByRole(userProfile?.role);
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

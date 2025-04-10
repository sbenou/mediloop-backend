
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
        
        // Set flag to prevent redirect loops
        sessionStorage.setItem('login_successful', 'true');
        sessionStorage.setItem('skip_dashboard_redirect', 'true');

        if (onSuccess) {
          onSuccess();
        } else {
          // If no success callback, redirect directly to the appropriate dashboard
          try {
            const route = getDashboardRouteByRole(profile?.role);
            window.location.href = route;
          } catch (navErr) {
            console.error('Navigation error:', navErr);
            navigate('/', { replace: true });
          }
        }
      }
    } catch (err: any) {
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

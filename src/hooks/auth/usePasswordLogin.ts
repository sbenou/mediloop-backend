
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

      // 4. Fetch user profile with timeout protection
      console.log("[usePasswordLogin] Fetching user profile");
      let profile = null;
      let pharmacyId = null;
      
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user?.id)
          .maybeSingle();
          
        // Use Promise.race with timeout
        const profileResult = await Promise.race([
          profilePromise,
          new Promise(resolve => {
            setTimeout(() => {
              console.log("[usePasswordLogin] Profile fetch timed out, continuing without profile data");
              resolve({ data: null, error: new Error('Profile fetch timed out') });
            }, 5000);
          })
        ]) as any;
        
        profile = profileResult?.data;
        
        // If we have a pharmacist role, try to fetch pharmacy relationship
        if (profile?.role === 'pharmacist') {
          try {
            const { data: pharmacyData } = await supabase
              .from('user_pharmacies')
              .select('pharmacy_id')
              .eq('user_id', data.user?.id)
              .maybeSingle();
              
            pharmacyId = pharmacyData?.pharmacy_id;
            console.log("[usePasswordLogin] Pharmacist pharmacy_id:", pharmacyId);
          } catch (err) {
            console.error("[usePasswordLogin] Error fetching pharmacy relationship:", err);
          }
        }
      } catch (profileError) {
        console.error('[usePasswordLogin] Error fetching profile:', profileError);
      }
      
      // 5. Create complete profile object with defaults for missing data
      const completeProfile = profile ? {
        ...profile as any,
        pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
        pharmacist_signature_url: profile.pharmacist_signature_url || null,
        pharmacy_id: pharmacyId || null,
        pharmacy_name: profile.pharmacy_name || null,
        pharmacy_logo_url: profile.pharmacy_logo_url || null
      } : {
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
        pharmacy_id: pharmacyId,
        pharmacy_name: null,
        pharmacy_logo_url: null
      };

      // 6. Update auth state
      setAuth({
        user: data.user,
        profile: completeProfile,
        permissions: [],
        isLoading: false,
      });
      
      // 7. Set flags for redirecting
      sessionStorage.setItem('login_successful', 'true');
      
      // 8. Determine redirect route
      const role = completeProfile?.role || 'patient';
      const redirectRoute = getDashboardRouteByRole(role);
      console.log("[usePasswordLogin] Redirecting to:", redirectRoute);
      
      // 9. Invoke success callback
      if (onSuccess) {
        onSuccess();
      }

      // 10. Cleanup and navigate
      setIsLoading(false);
      clearTimeout(loginTimeout);
      navigate(redirectRoute, { replace: true });
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


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

    // Set a global timeout to prevent the login process from hanging indefinitely
    const loginTimeout = setTimeout(() => {
      console.error('[usePasswordLogin] Login process timed out after 15 seconds');
      setIsLoading(false);
      
      toast({
        variant: "destructive",
        title: "Login timed out",
        description: "The login process took too long. Please try again.",
        duration: 5000, // Explicitly set duration
      });
    }, 15000);

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
          duration: 5000, // Explicitly set duration
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
        
      // Store the session immediately after login
      const sessionStored = storeSession(data.session);
      console.log("[usePasswordLogin] Login successful, storing session:", sessionStored ? "success" : "failed");
      console.log("[usePasswordLogin] User ID:", data.user?.id);
      console.log("[usePasswordLogin] User metadata:", data.user?.user_metadata);

      // Show success toast with specific duration
      toast({
        title: "Login successful",
        description: "You've been logged in successfully",
        duration: 5000, // Ensure 5-second display
      });

      console.log("[usePasswordLogin] Fetching user profile");
      
      // Set a timeout just for the profile fetch to prevent it from hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .maybeSingle();
        
      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Profile fetch timed out'));
        }, 5000);
      });
      
      try {
        const { data: profile, error: profileError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any;

        if (profileError) {
          console.error("[usePasswordLogin] Profile fetch error:", profileError);
          toast({
            variant: "destructive",
            title: "Profile Error",
            description: "There was an error loading your profile. Please try again.",
            duration: 5000,
          });
          setIsLoading(false);
          clearTimeout(loginTimeout);
          return;
        }
        
        console.log("[usePasswordLogin] Fetched profile:", profile);
        console.log("[usePasswordLogin] Raw profile role:", profile?.role);
        
        // Special handling for pharmacists - check if we need to get pharmacy info
        let pharmacyId = null;
        if (profile?.role === 'pharmacist') {
          console.log("[usePasswordLogin] Pharmacist detected, fetching pharmacy relationship");
          try {
            // Set a pharmacy fetch timeout
            const pharmacyPromise = supabase
              .from('user_pharmacies')
              .select('pharmacy_id')
              .eq('user_id', data.user?.id)
              .maybeSingle();
              
            const pharmacyTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                console.log("[usePasswordLogin] Pharmacy fetch timed out, continuing without pharmacy data");
                return { data: null, error: new Error('Pharmacy fetch timed out') };
              }, 3000); 
            });
            
            const { data: pharmacyData } = await Promise.race([pharmacyPromise, pharmacyTimeoutPromise]) as any;
            pharmacyId = pharmacyData?.pharmacy_id;
            console.log("[usePasswordLogin] Pharmacist pharmacy_id:", pharmacyId);
          } catch (pharmErr) {
            console.error("[usePasswordLogin] Error fetching pharmacy relationship:", pharmErr);
          }
        }
        
        const completeProfile = profile ? {
          ...profile as any,
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null,
          pharmacy_id: pharmacyId
        } : null;

        // Update auth state
        setAuth({
          user: data.user,
          profile: completeProfile,
          permissions: [],
          isLoading: false,
        });
        
        // Set flags for redirecting
        sessionStorage.setItem('login_successful', 'true');
        
        // Log role detection for debugging
        console.log("[usePasswordLogin] Role detected:", completeProfile?.role || 'patient');
        
        // Determine the redirect route based on role
        const role = completeProfile?.role || 'patient';
        const redirectRoute = getDashboardRouteByRole(role);
        console.log("[usePasswordLogin] Redirecting to:", redirectRoute);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        setIsLoading(false);
        clearTimeout(loginTimeout);
        
        // Use setTimeout for the navigation to ensure any state updates have completed
        setTimeout(() => {
          navigate(redirectRoute, { replace: true });
        }, 100);
      } catch (profileError: any) {
        console.error("[usePasswordLogin] Error or timeout during profile fetch:", profileError);
        
        // Even if profile fetch fails, try to continue with basic user data
        setAuth({
          user: data.user,
          profile: {
            id: data.user.id,
            role: data.user.user_metadata?.role || 'patient',
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || 'User',
            // Add other default fields
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
          },
          permissions: [],
          isLoading: false,
        });
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        setIsLoading(false);
        clearTimeout(loginTimeout);
        
        // Use role from user metadata as fallback
        const role = data.user.user_metadata?.role || 'patient';
        const redirectRoute = getDashboardRouteByRole(role);
        console.log("[usePasswordLogin] Using fallback route:", redirectRoute);
        
        // Use setTimeout for the navigation to ensure any state updates have completed
        setTimeout(() => {
          navigate(redirectRoute, { replace: true });
        }, 100);
      }
    } catch (err: any) {
      clearTimeout(loginTimeout);
      console.error('[usePasswordLogin] Unexpected error during login:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message || "An unexpected error occurred",
        duration: 5000, // Explicitly set duration
      });
      setIsLoading(false);
    }
  }, [email, setAuth, toast, onSuccess, navigate]);

  return { isLoading, error, handleLogin };
};

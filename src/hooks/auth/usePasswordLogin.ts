
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, clearAllAuthStorage } from "@/lib/supabase";
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { useNavigate } from 'react-router-dom';
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

interface UsePasswordLoginProps {
  email: string;
  onSuccess?: () => void;
}

export const usePasswordLogin = ({ email, onSuccess }: UsePasswordLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();

  const handleLogin = async (password: string, rememberMe: boolean) => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('Starting login process...', { email, rememberMe });

    try {
      // Clear any existing sessions to avoid conflicts
      clearAllAuthStorage();
      
      // First, sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }

      if (!signInData.user || !signInData.session) {
        console.error('No user or session data received');
        throw new Error('Authentication failed - missing user or session data');
      }

      console.log('Sign in successful:', signInData.user.id);
      
      // Validate session immediately
      const { data: userData, error: userValidationError } = await supabase.auth.getUser();
      
      if (userValidationError || !userData.user) {
        console.error('Session validation failed:', userValidationError);
        throw new Error('Session validation failed');
      }
      
      console.log('Session validation successful');

      // If rememberMe is checked, update the session 
      if (rememberMe && signInData.session) {
        console.log('Setting extended session duration due to Remember Me');
        // We'll update the session cookie manually
        const { error: sessionError } = await supabase.auth.updateUser({
          data: { rememberMe: true }
        });
        
        if (sessionError) {
          console.error('Failed to update session preferences:', sessionError);
        }
      }

      // Explicitly store session data to ensure persistence
      const session = signInData.session;
      const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        console.log('Session explicitly stored in both localStorage and sessionStorage');
      } catch (storageError) {
        console.error('Error storing session data:', storageError);
      }

      // Fetch user profile
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            console.log('No profile found, creating one...');
            try {
              // Extract role from user metadata if available
              const role = session.user.user_metadata?.role || 'patient';
              const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User';
              
              const { error: createError } = await supabase.rpc('create_profile_secure', {
                user_id: session.user.id,
                user_role: role,
                user_full_name: fullName,
                user_email: session.user.email || '',
                user_license_number: session.user.user_metadata?.license_number || null,
              });
              
              if (createError) {
                console.error('Error creating profile:', createError);
                throw new Error('Failed to create user profile');
              }
              
              // Fetch the newly created profile
              const { data: newProfile, error: newProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
                
              if (newProfileError || !newProfile) {
                console.error('Error fetching newly created profile:', newProfileError);
                throw new Error('Failed to fetch newly created profile');
              }
              
              console.log('Profile created and fetched successfully');
              
              // Update global auth state with new profile
              setAuth({
                user: session.user,
                profile: {
                  ...newProfile,
                  pharmacist_stamp_url: null,
                  pharmacist_signature_url: null
                },
                permissions: [],
                isLoading: false,
              });
              
              // Get the correct route based on the profile role
              const route = getDashboardRouteByRole(newProfile.role);
              navigate(route, { replace: true });
            } catch (createError) {
              console.error('Error in profile creation flow:', createError);
              throw new Error('Failed to create user profile');
            }
          } else {
            throw profileError;
          }
        } else if (profile) {
          // Update global auth state with existing profile
          // Ensure profile has all required properties
          const completeProfile = {
            ...profile,
            pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
            pharmacist_signature_url: profile.pharmacist_signature_url || null
          };

          setAuth({
            user: session.user,
            profile: completeProfile,
            permissions: [],
            isLoading: false,
          });
          console.log('Successfully updated auth state with existing profile');
          
          // Get the correct route based on the profile role
          const route = getDashboardRouteByRole(profile.role);
          console.log(`Redirecting to ${route} based on role ${profile.role}`);
          navigate(route, { replace: true });
        }
      } catch (profileError) {
        console.error('Profile handling error:', profileError);
        throw new Error('Profile error: ' + profileError.message);
      }

      // Show success message
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Reset auth state
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
      
      // Clear any potentially corrupted session data
      clearAllAuthStorage();

      // Show error message
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading };
};

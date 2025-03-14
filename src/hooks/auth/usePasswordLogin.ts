
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, clearAllAuthStorage } from "@/lib/supabase";
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { useNavigate } from 'react-router-dom';

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

      if (!signInData.user) {
        console.error('No user data received');
        throw new Error('No user data received');
      }

      console.log('Sign in successful:', signInData.user.id);

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

      // Get the session to confirm authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('No session after successful sign in');
        throw new Error('Authentication failed - no session');
      }

      console.log('Session confirmed:', session.user.id);

      // Store the session in multiple storage methods
      const storeSessionData = () => {
        const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
        const sessionString = JSON.stringify(session);
        
        // First attempt: localStorage for persistence across tabs and page reloads
        try {
          window.localStorage.setItem(STORAGE_KEY, sessionString);
          console.log('Session explicitly stored in localStorage');
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
        
        // Second attempt: sessionStorage for redundancy
        try {
          window.sessionStorage.setItem(STORAGE_KEY, sessionString);
          console.log('Session explicitly stored in sessionStorage');
        } catch (storageError) {
          console.error('Error saving to sessionStorage:', storageError);
        }
        
        // Attempt to dispatch a custom event for listeners
        try {
          const event = new CustomEvent('supabase:auth:token:update', {
            detail: {
              timestamp: new Date().toISOString(),
              userId: session.user.id,
              expiresAt: session.expires_at
            }
          });
          window.dispatchEvent(event);
          console.log('Dispatched token update event');
        } catch (eventError) {
          console.error('Error dispatching token event:', eventError);
        }
      };
      
      storeSessionData();
      
      // Validate the session before proceeding
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User validation error:', userError);
          throw new Error('Session validation failed');
        }
        
        if (!userData.user) {
          console.error('No user data in validation');
          throw new Error('Session validation failed');
        }
      } catch (validationError) {
        console.error('Session validation error:', validationError);
        clearAllAuthStorage();
        throw new Error('Session validation failed');
      }
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // If profile doesn't exist, try to create it
        if (profileError.code === 'PGRST116') {
          try {
            // Extract role from user metadata if available
            const role = session.user.user_metadata?.role || 'patient';
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User';
            
            await supabase.rpc('create_profile_secure', {
              user_id: session.user.id,
              user_role: role,
              user_full_name: fullName,
              user_email: session.user.email || '',
              user_license_number: session.user.user_metadata?.license_number || null,
            });
            
            // Try fetching again
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (newProfileError) {
              console.error('Error fetching newly created profile:', newProfileError);
              throw newProfileError;
            }
            
            // Use the newly created profile
            console.log('Successfully created and fetched profile');
            // Update global auth state
            setAuth({
              user: session.user,
              profile: newProfile,
              permissions: [],
              isLoading: false,
            });
          } catch (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
        } else {
          throw profileError;
        }
      } else if (profile) {
        // Update global auth state with existing profile
        setAuth({
          user: session.user,
          profile,
          permissions: [],
          isLoading: false,
        });
      }

      console.log('Auth state updated successfully');
      if (profile) {
        console.log('User role:', profile.role);
      }

      // Show success message
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Broadcast the login event to other tabs using localStorage event
      try {
        const loginEvent = {
          type: 'LOGIN',
          userId: session.user.id,
          timestamp: new Date().toISOString()
        };
        window.localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
        // Remove and set again to trigger storage events
        window.localStorage.removeItem('last_auth_event');
        window.localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
      } catch (eventError) {
        console.error('Error broadcasting login event:', eventError);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise, directly redirect to dashboard
        navigate('/dashboard', { replace: true });
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

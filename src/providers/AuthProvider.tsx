import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {
  Session,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthState } from '@/store/auth/atoms';
import { useRecoilState } from 'recoil';
import { authState as authStateAtom } from '@/store/auth/atoms';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/user';

interface AuthContextType {
  authState: AuthState;
  signIn: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string, type: 'magiclink' | 'email') => Promise<void>;
  signOut: () => Promise<void>;
  loadPermissions: (roleId: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useRecoilState(authStateAtom);
  const navigate = useNavigate();

  // Initialize auth state and session
  useEffect(() => {
    const loadSession = async () => {
      setAuthState(prevState => ({ ...prevState, isLoading: true }));
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await loadProfileData(session.user);
      } else {
        setAuthState(prevState => ({ ...prevState, isLoading: false }));
      }
    };

    loadSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event, session);

        if (event === 'INITIAL_SESSION') {
          if (session) {
            await loadProfileData(session.user);
          } else {
            setAuthState(prevState => ({ ...prevState, isLoading: false }));
          }
        } else if (event === 'SIGNED_IN') {
          if (session) {
            await loadProfileData(session.user);
            // Redirect based on role
            if (authState.profile?.role === 'pharmacist') {
              navigate('/dashboard?view=pharmacy');
            } else {
              navigate('/dashboard');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({ user: null, profile: null, isLoading: false, permissions: [] });
          navigate('/login');
        } else if (event === 'TOKEN_REFRESHED') {
          if (session) {
            await loadProfileData(session.user);
          }
        } else if (event === 'USER_UPDATED') {
          if (session) {
            await loadProfileData(session.user);
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, setAuthState]);

  const signIn = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      alert('Check your email for the login link!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const verifyOTP = async (email: string, token: string, type: 'magiclink' | 'email'): Promise<void> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });
      if (error) throw error;
      alert('Successfully signed in!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  // Load profile data
  const loadProfileData = async (user: User | null) => {
    if (!user) {
      setAuthState(prevState => ({
        ...prevState,
        profile: null,
        isLoading: false,
      }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setAuthState(prevState => ({
          ...prevState,
          profile: null,
          isLoading: false,
        }));
        return;
      }

      // Ensure type safety by validating data
      if (data) {
        // Create a type-safe profile object with all required fields
        const profile: UserProfile = {
          id: data.id,
          role: data.role || '',
          role_id: data.role_id,
          full_name: data.full_name,
          email: data.email,
          avatar_url: data.avatar_url,
          date_of_birth: data.date_of_birth,
          city: data.city,
          auth_method: data.auth_method,
          is_blocked: data.is_blocked,
          doctor_stamp_url: data.doctor_stamp_url,
          doctor_signature_url: data.doctor_signature_url,
          cns_card_front: data.cns_card_front,
          cns_card_back: data.cns_card_back,
          cns_number: data.cns_number,
          deleted_at: data.deleted_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
          license_number: data.license_number,
          // New fields
          pharmacy_name: data.pharmacy_name,
          pharmacy_logo_url: data.pharmacy_logo_url,
        };

        setAuthState(prevState => ({
          ...prevState,
          profile,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error in loadProfileData:', error);
      setAuthState(prevState => ({
        ...prevState,
        profile: null,
        isLoading: false,
      }));
    }
  };

  const loadPermissions = async (roleId: string | null) => {
    if (!roleId) {
      setAuthState(prevState => ({ ...prevState, permissions: [] }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', roleId);

      if (error) {
        console.error('Error fetching permissions:', error);
        setAuthState(prevState => ({ ...prevState, permissions: [] }));
        return;
      }

      // Extract the permission_id property from each item or use an empty array if no data
      const permissions = data 
        ? data.map(item => item.permission_id || '') 
        : [];
      
      setAuthState(prevState => ({ ...prevState, permissions }));
    } catch (error) {
      console.error('Error in loadPermissions:', error);
      setAuthState(prevState => ({ ...prevState, permissions: [] }));
    }
  };

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear local storage and reset auth state
      setAuthState({ user: null, profile: null, isLoading: false, permissions: [] });
      navigate('/login');
    } catch (error: any) {
      console.error("Error during sign out:", error);
      alert(error.error_description || error.message);
    }
  }, [navigate, setAuthState]);

  const contextValue: AuthContextType = {
    authState,
    signIn,
    verifyOTP,
    signOut,
    loadPermissions,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};


import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const fetchAndSetProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('Profile data:', profile);
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set initial loading state
        setAuth(state => ({ ...state, isLoading: true }));
        console.log('Getting session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          return;
        }

        if (!session?.user) {
          console.log('No active session found');
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          return;
        }

        console.log('Session found, fetching profile');
        try {
          const profile = await fetchAndSetProfile(session.user.id);
          if (!mounted) return;

          console.log('Setting auth state with profile:', profile);
          setAuth({
            user: session.user,
            profile: profile as UserProfile,
            permissions: [],
            isLoading: false,
          });
        } catch (error) {
          console.error('Profile fetch failed:', error);
          if (mounted) {
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);

        if (!mounted) return;

        // Set loading state for the auth change
        setAuth(state => ({ ...state, isLoading: true }));

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const profile = await fetchAndSetProfile(session.user.id);
            if (!mounted) return;

            console.log('Setting auth state after sign in:', {
              user: session.user,
              profile: profile,
            });

            setAuth({
              user: session.user,
              profile: profile as UserProfile,
              permissions: [],
              isLoading: false,
            });

            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
          } catch (error) {
            console.error('Sign in error:', error);
            if (mounted) {
              setAuth({
                user: null,
                profile: null,
                permissions: [],
                isLoading: false,
              });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        } else {
          // For other events, just update the loading state
          setAuth(state => ({ ...state, isLoading: false }));
        }
      }
    );

    return () => {
      console.log('Cleaning up AuthProvider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth]);

  return <>{children}</>;
};


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
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  // Initialize auth state with session
  useEffect(() => {
    let mounted = true;

    // Set initial loading state immediately
    setAuth(prev => {
      console.log('Setting initial loading state...');
      return { ...prev, isLoading: true };
    });

    const initializeAuth = async () => {
      if (!mounted) return;

      try {
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

        console.log('Session response:', session ? 'Session exists' : 'No session');

        if (!session?.user) {
          console.log('No active session found, setting initial state...');
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          return;
        }

        try {
          const profile = await fetchAndSetProfile(session.user.id);
          console.log('Profile fetched successfully, setting auth state...');
          setAuth({
            user: session.user,
            profile: profile as UserProfile,
            permissions: [],
            isLoading: false,
          });
        } catch (error) {
          console.error('Profile fetch failed:', error);
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
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

    console.log('Starting auth initialization...');
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, fetching profile...');
          try {
            const profile = await fetchAndSetProfile(session.user.id);
            
            if (!mounted) return;

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
            console.error('Error handling sign in:', error);
            if (mounted) {
              setAuth({
                user: null,
                profile: null,
                permissions: [],
                isLoading: false,
              });
            }
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('User signed out or deleted, clearing auth state...');
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      }
    );

    return () => {
      console.log('Cleaning up AuthProvider...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth]);

  return <>{children}</>;
};

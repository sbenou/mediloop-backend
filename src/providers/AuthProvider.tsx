
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const fetchAndSetProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('Fetching profile for user:', userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }

    console.log('Profile data:', profile);
    return profile;
  };

  const updateAuthState = async (session: any | null) => {
    if (!session?.user) {
      console.log('No session, clearing auth state');
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
      return;
    }

    try {
      console.log('Fetching profile for session:', session.user.id);
      const profile = await fetchAndSetProfile(session.user.id);
      
      setAuth({
        user: session.user,
        profile: profile,
        permissions: [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error updating auth state:', error);
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAuth(state => ({ ...state, isLoading: true }));
        console.log('Getting session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        await updateAuthState(session);
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

        setAuth(state => ({ ...state, isLoading: true }));

        switch (event) {
          case 'SIGNED_IN':
            await updateAuthState(session);
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
            break;
          
          case 'SIGNED_OUT':
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
            break;
          
          default:
            // For other events, just update loading state
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

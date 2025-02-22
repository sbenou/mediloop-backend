
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
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      console.log('Profile data received:', profile);
      return profile;
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
      throw error;
    }
  };

  const updateAuthState = async (session: any | null) => {
    console.log('Updating auth state with session:', session?.user?.id);
    
    try {
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

      const profile = await fetchAndSetProfile(session.user.id);
      console.log('Setting auth state with profile:', profile);
      
      setAuth({
        user: session.user,
        profile: profile,
        permissions: [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error in updateAuthState:', error);
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
      console.log('Initializing auth...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Got session:', session?.user?.id);
        
        if (!mounted) return;
        
        if (session?.user) {
          setAuth(state => ({ ...state, isLoading: true }));
          await updateAuthState(session);
        } else {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
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

        switch (event) {
          case 'SIGNED_IN':
            setAuth(state => ({ ...state, isLoading: true }));
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
          
          case 'USER_UPDATED':
            if (session) {
              await updateAuthState(session);
            }
            break;
          
          default:
            if (session) {
              await updateAuthState(session);
            } else {
              setAuth(state => ({
                ...state,
                isLoading: false
              }));
            }
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

export default AuthProvider;

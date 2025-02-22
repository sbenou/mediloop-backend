
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const fetchAndSetProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('Starting profile fetch for user:', userId);
    try {
      // First verify the profile query works
      const { data: profileCheck, error: checkError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
        
      console.log('Profile check result:', profileCheck, 'Error:', checkError);

      // Now get the full profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          full_name,
          email,
          avatar_url,
          auth_method,
          is_blocked,
          city,
          date_of_birth,
          license_number,
          cns_card_front,
          cns_card_back,
          cns_number,
          doctor_stamp_url,
          doctor_signature_url
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      if (!profile) {
        console.error('No profile found for user:', userId);
        return null;
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
      
      if (!profile) {
        console.error('No profile found after fetch, clearing auth state');
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      setAuth({
        user: session.user,
        profile,
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

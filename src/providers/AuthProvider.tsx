
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  // Initialize auth state with session
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          console.log('Initial session found:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          if (mounted) {
            setAuth({
              user: session.user,
              profile: profile as UserProfile,
              permissions: [],
              isLoading: false,
            });
          }
        } else {
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
        console.error('Error initializing auth:', error);
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

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) throw profileError;

            if (mounted) {
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
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
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
          if (mounted) {
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth]);

  return <>{children}</>;
};

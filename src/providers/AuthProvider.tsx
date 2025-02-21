
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      console.log('Checking initial session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
        return null;
      }
      console.log('Initial session:', session ? 'Found' : 'None');
      return session;
    },
  });

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      console.log('Fetching user profile for:', userId);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        const { data: permissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', profile?.role_id);

        if (permissionsError) {
          console.error('Permissions fetch error:', permissionsError);
          return {
            profile: profile as UserProfile,
            permissions: [],
          };
        }

        console.log('Profile and permissions fetched successfully');
        return {
          profile: profile as UserProfile,
          permissions: permissions?.map(p => p.permission_id) || [],
        };
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        throw error;
      }
    };

    const updateAuthState = async () => {
      console.log('Updating auth state with session:', session?.user?.id);
      try {
        if (session?.user) {
          const { profile, permissions } = await fetchUserProfile(session.user.id);
          setAuth({
            user: session.user,
            profile,
            permissions,
            isLoading: false,
          });
          console.log('Auth state updated with user:', session.user.id);
        } else {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          console.log('Auth state cleared - no session');
        }
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

    updateAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, userId: session?.user?.id });
      
      try {
        if (session?.user) {
          const { profile, permissions } = await fetchUserProfile(session.user.id);
          setAuth({
            user: session.user,
            profile,
            permissions,
            isLoading: false,
          });
          
          if (event === 'SIGNED_IN') {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
          }
        } else {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          
          if (event === 'SIGNED_OUT') {
            toast({
              title: "Signed out",
              description: "You have been signed out.",
            });
          }
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [session, setAuth]);

  return <>{children}</>;
};

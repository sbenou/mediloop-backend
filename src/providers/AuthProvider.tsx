import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { useQuery } from '@tanstack/react-query';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: permissions } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', profile?.role_id);

      return {
        profile,
        permissions: permissions?.map(p => p.permission_id) || [],
      };
    };

    const updateAuthState = async () => {
      if (session?.user) {
        const { profile, permissions } = await fetchUserProfile(session.user.id);
        setAuth({
          user: session.user,
          profile,
          permissions,
          isLoading: false,
        });
      } else {
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
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        const { profile, permissions } = await fetchUserProfile(session.user.id);
        setAuth({
          user: session.user,
          profile,
          permissions,
          isLoading: false,
        });
      } else {
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session, setAuth]);

  return <>{children}</>;
};
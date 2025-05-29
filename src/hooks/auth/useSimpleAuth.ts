
import { useAuthContext } from '@/contexts/AuthContext';

export const useSimpleAuth = () => {
  const context = useAuthContext();
  
  return {
    user: context.user,
    session: context.session,
    isLoading: context.isLoading,
    isAuthenticated: !!context.user,
    signOut: context.signOut,
    userRole: context.user?.user_metadata?.role || null,
  };
};

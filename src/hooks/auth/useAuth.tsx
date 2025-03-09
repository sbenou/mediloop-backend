
import { useRecoilValue } from 'recoil';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector,
  isPharmacistSelector
} from '@/store/auth/selectors';
import { authState } from '@/store/auth/atoms';
import { supabase } from '@/lib/supabase';
import { getSessionFromStorage } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export const useAuth = () => {
  // Get all state values first
  const auth = useRecoilValue(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const isPharmacistFromSelector = useRecoilValue(isPharmacistSelector);
  
  // Calculate isPharmacist more aggressively to ensure it's correct
  const isPharmacist = auth.profile?.role === 'pharmacist' || isPharmacistFromSelector || userRole === 'pharmacist';
  
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  
  // Log critical auth data every time
  useEffect(() => {
    console.log('useAuth hook - auth data:', {
      isAuthenticated,
      userRole,
      profileRole: auth.profile?.role,
      isPharmacist,
      isPharmacistFromSelector
    });
  }, [isAuthenticated, userRole, auth.profile, isPharmacist, isPharmacistFromSelector]);
  
  // Better session recovery for tab switching and session expiry
  const refreshSession = useCallback(async () => {
    if (isRefreshingSession) return;
    
    try {
      setIsRefreshingSession(true);
      console.log('Attempting to refresh session...');
      
      // Check in storage first
      const storedSession = getSessionFromStorage();
      
      if (!storedSession) {
        // Try to get from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return null;
        }
        
        if (!data.session) {
          // Try to refresh
          console.log('No session found, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.warn('Unable to refresh session:', refreshError);
            return null;
          }
          
          console.log('Session refreshed successfully');
          return refreshData.session;
        }
        
        return data.session;
      }
      
      return storedSession;
    } catch (err) {
      console.error('Session refresh error:', err);
      return null;
    } finally {
      setIsRefreshingSession(false);
    }
  }, [isRefreshingSession]);
  
  // Extra check to ensure we have a session when auth claims we're authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Verify that we actually have a session
      const checkSessionExists = async () => {
        // Check from storage first (faster)
        const storedSession = getSessionFromStorage();
        
        if (!storedSession) {
          // If not in storage, check from Supabase
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.warn('Auth state claims user is authenticated but no session exists');
            // Try to refresh the session
            const session = await refreshSession();
            
            if (!session) {
              console.warn('Unable to recover session after tab switch');
              // Don't automatically sign out - let the user see the UI first
              // and handle auth errors if they try to access protected resources
            }
          }
        }
      };
      
      checkSessionExists();
    }
  }, [isAuthenticated, isLoading, refreshSession]);
  
  // Handle tab visibility change to check session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        console.log('Tab became visible, verifying session...');
        const session = await refreshSession();
        
        if (!session && isAuthenticated) {
          console.warn('Session verification failed on tab visibility change');
          // Optionally inform the user their session might be expired
          toast({
            title: "Session Status",
            description: "Your session may have expired. Please refresh the page if you encounter any issues.",
            duration: 5000,
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refreshSession]);

  // Debug checks for route mismatches based on role
  useEffect(() => {
    if (isAuthenticated && !isLoading && userRole) {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      
      // Debug log for pharmacy role - expand for more detail
      if (userRole === 'pharmacist' || auth.profile?.role === 'pharmacist') {
        console.log('User has pharmacist role - should see pharmacy profile link');
        console.log('Direct check:', auth.profile?.role === 'pharmacist');
        console.log('Selector check:', isPharmacistFromSelector);
        console.log('Combined check:', isPharmacist);
        console.log('Full auth profile:', auth.profile);
        
        // Check if pharmacist should be redirected to pharmacy view
        if (currentPath === '/dashboard' && !currentSearch.includes('view=pharmacy')) {
          console.warn('Pharmacist on dashboard without pharmacy view! Current URL:', 
            window.location.href);
        }
      }
      
      // Check if a superadmin is on a non-superadmin page
      if (userRole === 'superadmin' && 
          !currentPath.startsWith('/superadmin') && 
          !currentPath.startsWith('/admin-settings') &&
          currentPath !== '/login' &&
          currentPath !== '/dashboard') {
        console.warn(`Warning: Superadmin user accessing non-superadmin route: ${currentPath}`);
      }
      
      // Check if a pharmacist is on a non-pharmacy page
      if (userRole === 'pharmacist' && 
          !currentPath.startsWith('/pharmacy') && 
          currentPath !== '/login' &&
          currentPath !== '/dashboard') {
        console.warn(`Warning: Pharmacist user accessing non-pharmacy route: ${currentPath}`);
      }
      
      // Check if a patient is on a non-patient page - exclude unified-profile and patient-dashboard routes
      if (userRole === 'patient' && 
          !currentPath.startsWith('/patient') && 
          currentPath !== '/login' &&
          currentPath !== '/patient-dashboard' &&
          currentPath !== '/unified-profile' &&
          currentPath !== '/dashboard') {
        console.warn(`Warning: Patient user accessing non-patient route: ${currentPath}`);
      }
      
      // Log the current role and path for debugging
      console.log(`Current user role: ${userRole}, Current path: ${currentPath}, Is pharmacist: ${isPharmacist}`);
    }
  }, [isAuthenticated, isLoading, userRole, auth.profile, isPharmacist, isPharmacistFromSelector]);

  // Memoize all values together to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => ({
    profile: auth.profile,
    user: auth.user,
    hasPermission: (permission: string) => isLoading || permissions.includes(permission),
    isPharmacist: isPharmacist,
  }), [auth.profile, auth.user, isLoading, permissions, isPharmacist]);

  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission: memoizedValues.hasPermission,
    user: memoizedValues.user,
    profile: memoizedValues.profile,
    refreshSession,
    isPharmacist
  };
};

export default useAuth;

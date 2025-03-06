
import { useRecoilValue } from 'recoil';
import { useMemo, useEffect, useState } from 'react';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';
import { authState } from '@/store/auth/atoms';
import { supabase, getSessionFromStorage } from '@/lib/supabase';

export const useAuth = () => {
  // Local state to track if initial auth check has completed
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Get all state values first
  const auth = useRecoilValue(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  
  // Extra check to ensure we have a session when auth claims we're authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Verify that we actually have a session
      const checkSessionExists = async () => {
        // Check from storage first (faster)
        const storedSession = getSessionFromStorage();
        
        if (!storedSession) {
          console.log("Authentication check: No session found in storage");
          // If not in storage, check from Supabase
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.warn('Auth state claims user is authenticated but no session exists');
          } else {
            console.log("Authentication check: Session found via API but not in storage");
          }
        } else {
          console.log("Authentication check: Valid session found in storage");
        }
      };
      
      checkSessionExists();
    }
  }, [isAuthenticated, isLoading]);

  // Run initial auth check and update local state when done
  useEffect(() => {
    const runInitialCheck = async () => {
      try {
        // Check if we have a session
        const { data } = await supabase.auth.getSession();
        console.log("Initial auth check complete:", data.session ? "Session found" : "No session");
      } catch (err) {
        console.error("Error during initial auth check:", err);
      } finally {
        // Mark initial check as done regardless of result
        setInitialCheckDone(true);
      }
    };
    
    if (!initialCheckDone) {
      runInitialCheck();
    }
  }, [initialCheckDone]);

  // Debug logging for auth state changes
  useEffect(() => {
    console.log("Auth state changed:", {
      isAuthenticated,
      isLoading,
      userRole,
      hasProfile: !!auth.profile,
      initialCheckDone
    });
  }, [isAuthenticated, isLoading, userRole, auth.profile, initialCheckDone]);

  // Debug checks for route mismatches based on role
  useEffect(() => {
    if (isAuthenticated && !isLoading && userRole) {
      const currentPath = window.location.pathname;
      
      // Check if a superadmin is on a non-superadmin page
      if (userRole === 'superadmin' && 
          !currentPath.startsWith('/superadmin') && 
          !currentPath.startsWith('/admin-settings') &&
          currentPath !== '/login') {
        console.warn(`Warning: Superadmin user accessing non-superadmin route: ${currentPath}`);
      }
      
      // Check if a pharmacist is on a non-pharmacy page
      if (userRole === 'pharmacist' && 
          !currentPath.startsWith('/pharmacy') && 
          currentPath !== '/login' &&
          currentPath !== '/dashboard' && 
          !currentPath.startsWith('/legacy')) {
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
      console.log(`Current user role: ${userRole}, Current path: ${currentPath}`);
    }
  }, [isAuthenticated, isLoading, userRole]);

  // Memoize all values together to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => ({
    profile: auth.profile,
    user: auth.user,
    hasPermission: (permission: string) => isLoading || permissions.includes(permission),
  }), [auth.profile, auth.user, isLoading, permissions]);

  // Return augmented values to include initialCheckDone for more accurate loading states
  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading: isLoading && !initialCheckDone, // Only consider loading if recoil is loading AND initial check isn't done
    hasPermission: memoizedValues.hasPermission,
    user: memoizedValues.user,
    profile: memoizedValues.profile,
    initialCheckDone
  };
};

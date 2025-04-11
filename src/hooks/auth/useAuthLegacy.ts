
import { useRecoilValue } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const auth = useRecoilValue(authState);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);
  
  // Extract values from auth state
  const user = auth.user;
  const profile = auth.profile;
  const isLoading = auth.isLoading;
  const permissions = auth.permissions || [];

  // Derived states
  const isAuthenticated = !!user && !!profile;
  const userRole = profile?.role || null;
  const isPharmacist = userRole === 'pharmacist' || profile?.role === 'pharmacist';
  
  // For debugging - track inconsistent auth state
  const hasInconsistentState = !!user && !profile && !isLoading;
  
  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string) => {
    if (isLoading) return false;
    return permissions.includes(permission);
  }, [permissions, isLoading]);
  
  // Manual profile fetch function for cases where profile is missing
  const fetchProfileManually = useCallback(async () => {
    if (!user?.id || profileLoadAttempted) return;
    
    try {
      console.log("[useAuth][DEBUG] Inconsistent state: user exists but no profile");
      console.log("[useAuth][DEBUG] Attempting to fetch profile for user:", user.id);
      
      setProfileLoadAttempted(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("[useAuth][DEBUG] Manual profile fetch error:", error);
        return;
      }
      
      if (data) {
        console.log("[useAuth][DEBUG] Successfully fetched profile for user:", user.id);
        
        // Force a page reload to refresh the auth state properly
        window.location.reload();
      } else {
        console.log("[useAuth][DEBUG] No profile found for user:", user.id);
        
        // Show a toast notification to inform the user
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Unable to load your profile data. Please try logging in again.",
        });
      }
    } catch (err) {
      console.error("[useAuth][DEBUG] Error during manual profile fetch:", err);
    }
  }, [user?.id, profileLoadAttempted]);
  
  // Automatically try to fix inconsistent state
  useEffect(() => {
    if (hasInconsistentState) {
      fetchProfileManually();
    }
  }, [hasInconsistentState, fetchProfileManually]);
  
  // Debug current auth state
  useEffect(() => {
    console.log("[useAuth][DEBUG] Current auth state:", {
      isAuthenticated,
      userRole,
      isPharmacist,
      userId: user?.id,
      profileId: profile?.id,
      email: user?.email,
      profileRole: profile?.role,
      permissionsCount: permissions.length
    });
  }, [isAuthenticated, userRole, isPharmacist, user, profile, permissions]);
  
  return {
    isAuthenticated,
    isLoading,
    user,
    profile,
    userRole,
    isPharmacist,
    permissions,
    hasPermission,
    fetchProfileManually,
  };
};

export default useAuth;

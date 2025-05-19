
import { useRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export function useAuth() {
  const [state, setState] = useRecoilState(authState);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { user, profile, permissions = [] } = state;
  
  // Determine if the user is authenticated
  const isAuthenticated = !!state.user && !!profile;
  
  // Get the user role from the profile if available
  const userRole = profile?.role || null;
  
  // Special helper for checking if the user is a pharmacist
  const isPharmacist = userRole === 'pharmacist';
  
  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions.includes(permission);
  };
  
  // Fetch the profile when the user changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setState(prev => ({
            ...prev,
            profile: data
          }));
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, setState]);
  
  return {
    user,
    profile,
    permissions,
    isAuthenticated,
    userRole,
    isPharmacist,
    hasPermission,
    isLoading
  };
}

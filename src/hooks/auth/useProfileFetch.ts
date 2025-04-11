
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export const useProfileFetch = () => {
  // Function to fetch a user profile
  const fetchAndSetProfile = useCallback(async (userId: string) => {
    try {
      console.log("[ProfileFetch][DEBUG] Fetching profile for user:", userId);
      
      // Use a comprehensive profile fetch approach
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("[ProfileFetch][DEBUG] Error fetching profile:", error);
        return { profile: null, permissions: [] };
      }
      
      if (!data) {
        console.error("[ProfileFetch][DEBUG] No profile found for user:", userId);
        return { profile: null, permissions: [] };
      }
      
      console.log("[ProfileFetch][DEBUG] Successfully fetched profile:", {
        userId,
        role: data.role,
        fields: Object.keys(data)
      });
      
      // We would normally fetch permissions here if needed
      const permissions: string[] = [];
      
      return { 
        profile: data, 
        permissions
      };
    } catch (err) {
      console.error("[ProfileFetch][DEBUG] Profile fetch error:", err);
      return { profile: null, permissions: [] };
    }
  }, []);
  
  return { fetchAndSetProfile };
};

export default useProfileFetch;

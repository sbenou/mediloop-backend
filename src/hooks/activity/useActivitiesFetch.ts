
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity } from "./types";

export const useActivitiesFetch = (userId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchActivities = useCallback(async (id?: string, page = 0, limit = 20) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If no user ID provided, get current user's ID
      let userIdToUse = id;
      if (!userIdToUse) {
        const { data: { session } } = await supabase.auth.getSession();
        userIdToUse = session?.user?.id;
      }
      
      if (!userIdToUse) {
        console.log("No user ID available for fetching activities");
        setActivities([]);
        setHasMore(false);
        setIsLoading(false);
        return [];
      }
      
      const startIndex = page * limit;
      
      console.log(`Fetching activities for user ID: ${userIdToUse}`);
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userIdToUse)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + limit - 1);
      
      if (error) {
        throw new Error(`Error fetching activities: ${error.message}`);
      }
      
      // Ensure all activities have required properties for components
      const processedActivities = data.map((activity): Activity => {
        return {
          ...activity,
          read: activity.read !== undefined ? activity.read : activity.status === 'read',
          timestamp: activity.timestamp || activity.created_at || new Date().toISOString(),
        };
      });
      
      if (page === 0) {
        setActivities(processedActivities);
      } else {
        setActivities(prev => [...prev, ...processedActivities]);
      }
      
      setHasMore(data.length === limit);
      return processedActivities;
      
    } catch (err) {
      console.error("Error in fetchActivities:", err);
      setError(err instanceof Error ? err : new Error('Unknown error in fetchActivities'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    fetchActivities
  };
};

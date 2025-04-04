
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/components/activity/ActivityItem';
import { toast } from '@/components/ui/use-toast';
import { ActivitiesResponse } from './types';

export function useActivitiesFetch() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchActivities = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching activities...");
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error("Error from Supabase:", error);
        setError(new Error(error.message));
        throw error;
      }

      console.log("Raw activities data from Supabase:", data);

      if (data && Array.isArray(data)) {
        // Transform the data into the Activity format
        const formattedActivities: Activity[] = (data as ActivitiesResponse[]).map(item => ({
          id: item.id,
          type: item.type as any,
          title: item.title,
          description: item.description,
          timestamp: new Date(item.timestamp),
          read: item.read
        }));
        
        console.log("Formatted activities:", formattedActivities);
        
        setActivities(formattedActivities);
        setUnreadCount(formattedActivities.filter(activity => !activity.read).length);
        setLastFetchTime(Date.now());
      } else {
        // Handle empty data case
        console.log("No activities data returned from Supabase");
        setActivities([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error instanceof Error ? error : new Error('Unknown error fetching activities'));
      toast({
        title: 'Error',
        description: 'Failed to load activities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    activities,
    setActivities,
    isLoading,
    error,
    unreadCount,
    setUnreadCount,
    lastFetchTime,
    fetchActivities
  };
}

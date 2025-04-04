
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/components/activity/ActivityItem';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

// Define type for activities table in Supabase
interface ActivitiesResponse {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  meta?: any;
  team_id?: string;
  tenant_id?: string;
  related_id?: string;
  related_type?: string;
}

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching activities...");
      
      // Use the explicit cast to tell TypeScript we're using the custom activities table
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

      if (data) {
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
  }, []);

  // Add a refresh function that can be called to force a reload
  const refreshActivities = useCallback(() => {
    // Only refresh if it's been more than 1 second since the last fetch
    // to prevent too many refreshes happening at once
    if (Date.now() - lastFetchTime > 1000) {
      console.log("Refreshing activities...");
      fetchActivities();
    } else {
      console.log("Skipping refresh - too soon since last fetch");
    }
  }, [fetchActivities, lastFetchTime]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log(`Marking activity ${id} as read`);
      // Use the explicit function call for the stored procedure
      const { error } = await supabase.rpc('mark_activity_read', {
        activity_id: id
      });

      if (error) {
        console.error("Error marking activity as read:", error);
        throw error;
      }

      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === id ? { ...activity, read: true } : activity
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: 'Activity marked as read',
      });
    } catch (error) {
      console.error('Error marking activity as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark activity as read',
        variant: 'destructive',
      });
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      console.log("Marking all activities as read");
      // Use the explicit function call for the stored procedure
      const { error } = await supabase.rpc('mark_all_activities_read');

      if (error) {
        console.error("Error marking all activities as read:", error);
        throw error;
      }

      // Update local state
      setActivities(prev => 
        prev.map(activity => ({ ...activity, read: true }))
      );
      setUnreadCount(0);

      toast({
        title: 'All activities marked as read',
      });
    } catch (error) {
      console.error('Error marking all activities as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all activities as read',
        variant: 'destructive',
      });
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    console.log("Setting up realtime subscription for activities...");
    
    const channel = supabase
      .channel('activities_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities'
      }, (payload) => {
        console.log("Realtime update received:", payload);
        refreshActivities();
      })
      .subscribe((status) => {
        console.log("Supabase channel status:", status);
      });

    return () => {
      console.log("Cleaning up activities subscription");
      supabase.removeChannel(channel);
    };
  }, [refreshActivities]);

  return {
    activities,
    isLoading,
    error,
    unreadCount,
    fetchActivities,
    refreshActivities,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription
  };
};

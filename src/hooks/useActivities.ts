
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/components/activity/ActivityItem';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Transform the data into the Activity format
        const formattedActivities: Activity[] = data.map(item => ({
          id: item.id,
          type: item.type as any,
          title: item.title,
          description: item.description,
          timestamp: new Date(item.timestamp),
          read: item.read
        }));
        
        setActivities(formattedActivities);
        setUnreadCount(formattedActivities.filter(activity => !activity.read).length);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.rpc('mark_activity_read', {
        activity_id: id
      });

      if (error) {
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
      const { error } = await supabase.rpc('mark_all_activities_read');

      if (error) {
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
    const channel = supabase
      .channel('activities_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities'
      }, (payload) => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    unreadCount,
    fetchActivities,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription
  };
};

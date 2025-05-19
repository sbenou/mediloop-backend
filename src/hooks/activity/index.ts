
import { useState, useCallback, useEffect } from 'react';
import { useActivitiesFetch } from './useActivitiesFetch';
import { Activity } from './types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';

export const useActivities = () => {
  const { isAuthenticated, user } = useAuth();
  const { activities, isLoading, error, fetchActivities } = useActivitiesFetch(user?.id);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial fetch when the component mounts
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshActivities();
    }
  }, [isAuthenticated, user?.id]);

  // Function to refresh activities
  const refreshActivities = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchActivities();
    } catch (err) {
      console.error('Error refreshing activities:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch activities',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchActivities]);

  // Mark an activity as read
  const markAsRead = useCallback(async (activityId: string) => {
    try {
      await supabase.rpc('mark_activity_read', { activity_id: activityId });
      
      // Update the local state
      const updatedActivities = activities.map(activity => {
        if (activity.id === activityId) {
          return { ...activity, read: true };
        }
        return activity;
      });
      
      return true;
    } catch (err) {
      console.error('Error marking activity as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark activity as read',
        variant: 'destructive',
      });
      return false;
    }
  }, [activities]);

  // Mark all activities as read
  const markAllAsRead = useCallback(async () => {
    try {
      await supabase.rpc('mark_all_activities_read');
      
      // Update the local state
      const updatedActivities = activities.map(activity => ({
        ...activity,
        read: true
      }));
      
      toast({
        title: 'Success',
        description: 'All activities marked as read',
      });
      
      return true;
    } catch (err) {
      console.error('Error marking all activities as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark all activities as read',
        variant: 'destructive',
      });
      return false;
    }
  }, [activities]);

  return {
    activities,
    isLoading: isLoading || isRefreshing,
    error,
    refreshActivities,
    markAsRead,
    markAllAsRead
  };
};

export type { Activity };

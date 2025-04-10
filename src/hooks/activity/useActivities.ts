
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';
import { Activity } from '@/components/activity/ActivityItem';
import { useActivityReadOperations } from './useActivityReadOperations';
import { useActivitiesFetch } from './useActivitiesFetch';
import { useActivitySubscription } from './useActivitySubscription';

export const useActivities = (limit: number = 10) => {
  const { profile } = useAuth();
  const { 
    activities: fetchedActivities, 
    isLoading, 
    error,
    unreadCount,
    fetchActivities,
    setActivities,
    setUnreadCount
  } = useActivitiesFetch();
  
  // Transform fetched activities to match ActivityItem's Activity type
  const activities: Activity[] = fetchedActivities.map(activity => ({
    ...activity,
    timestamp: new Date(activity.timestamp) // Convert string timestamp to Date
  }));
  
  // Get mark as read operations
  const { markAsRead, markAllAsRead } = useActivityReadOperations({
    activities: fetchedActivities,
    setActivities,
    setUnreadCount
  });

  // Set up realtime subscription
  const { setupRealtimeSubscription } = useActivitySubscription({
    refreshActivities: useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  });
  
  // Fetch activities when profile changes
  useEffect(() => {
    if (profile?.id) {
      fetchActivities();
      
      // Set up subscription for real-time updates
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [profile?.id, fetchActivities, setupRealtimeSubscription]);

  // Extra utility function to manually refresh activities
  const refreshActivities = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);
  
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

export default useActivities;

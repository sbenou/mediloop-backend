
import { useCallback, useRef } from 'react';
import { useActivitiesFetch } from './useActivitiesFetch';
import { useActivityReadOperations } from './useActivityReadOperations';
import { useActivitySubscription } from './useActivitySubscription';
import { UseActivitiesReturn } from './types';

export const useActivities = (): UseActivitiesReturn => {
  const { 
    activities, 
    setActivities, 
    isLoading, 
    error, 
    unreadCount, 
    setUnreadCount, 
    lastFetchTime, 
    fetchActivities 
  } = useActivitiesFetch();
  
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add a refresh function that can be called to force a reload
  const refreshActivities = useCallback(() => {
    // Only refresh if it's been more than 1 second since the last fetch
    // to prevent too many refreshes happening at once
    if (Date.now() - lastFetchTime > 1000) {
      console.log("Refreshing activities...");
      
      // Clear any pending fetch timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Set a small timeout to debounce multiple refresh calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchActivities();
      }, 300);
    } else {
      console.log("Skipping refresh - too soon since last fetch");
    }
  }, [fetchActivities, lastFetchTime]);

  const { 
    markAsRead, 
    markAllAsRead 
  } = useActivityReadOperations({
    activities,
    setActivities,
    setUnreadCount
  });

  const { 
    setupRealtimeSubscription 
  } = useActivitySubscription({
    refreshActivities
  });

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


import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseActivitySubscriptionProps {
  refreshActivities: () => void;
}

export const useActivitySubscription = ({ 
  refreshActivities 
}: UseActivitySubscriptionProps) => {
  const setupRealtimeSubscription = useCallback(() => {
    console.log("Setting up realtime subscription for activities");
    
    const channel = supabase
      .channel('activities_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities'
      }, (payload) => {
        console.log("Activity change detected:", payload);
        refreshActivities();
      })
      .subscribe();

    // Return cleanup function
    return () => {
      console.log("Cleaning up activities realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [refreshActivities]);

  return {
    setupRealtimeSubscription
  };
};

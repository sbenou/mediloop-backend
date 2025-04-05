
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseActivitySubscriptionProps {
  refreshActivities: () => void;
}

export const useActivitySubscription = ({ 
  refreshActivities 
}: UseActivitySubscriptionProps) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const setupRealtimeSubscription = useCallback(() => {
    // If a subscription already exists, don't create another one
    if (channelRef.current) {
      console.log("Reusing existing activity subscription");
      return () => {};
    }
    
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
      
    // Store the channel reference
    channelRef.current = channel;

    // Return cleanup function
    return () => {
      console.log("Cleaning up activities realtime subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [refreshActivities]);
  
  // Clean up subscription when component unmounts
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        console.log("Unmount: Cleaning up activities realtime subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    setupRealtimeSubscription
  };
};

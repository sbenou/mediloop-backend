
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseActivitySubscriptionProps {
  refreshActivities: () => void;
}

export const useActivitySubscription = ({ 
  refreshActivities 
}: UseActivitySubscriptionProps) => {
  // Static ref to track subscription across component instances
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Flag to track if this hook instance set up the subscription
  const didSetupSubscriptionRef = useRef(false);
  
  const setupRealtimeSubscription = useCallback(() => {
    // If a subscription already exists globally, don't create another one
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
    // Mark that this hook instance set up the subscription
    didSetupSubscriptionRef.current = true;

    // Return cleanup function
    return () => {
      // Only clean up if this hook instance created the subscription
      if (didSetupSubscriptionRef.current) {
        console.log("Cleaning up activities realtime subscription");
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    };
  }, [refreshActivities]);
  
  // Clean up subscription when component unmounts
  useEffect(() => {
    return () => {
      if (didSetupSubscriptionRef.current && channelRef.current) {
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

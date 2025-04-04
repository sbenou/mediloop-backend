import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseActivitySubscriptionProps {
  refreshActivities: () => void;
}

export function useActivitySubscription({ 
  refreshActivities 
}: UseActivitySubscriptionProps) {
  const channelRef = useRef<any>(null);

  const setupRealtimeSubscription = useCallback(() => {
    console.log("Setting up realtime subscription for activities...");
    
    // Clean up any existing subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
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
    
    // Keep a reference to the channel for cleanup
    channelRef.current = channel;

    return () => {
      console.log("Cleaning up activities subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [refreshActivities]);

  return {
    setupRealtimeSubscription
  };
}

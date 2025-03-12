
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export const useSessionPolling = () => {
  const sessionPollingRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any existing interval first
    if (sessionPollingRef.current) {
      window.clearInterval(sessionPollingRef.current);
    }
    
    // Poll every 15 seconds to ensure session is still valid
    sessionPollingRef.current = window.setInterval(async () => {
      try {
        // Only poll when tab is visible
        if (document.visibilityState === 'visible') {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error polling session:', error);
            return;
          }
          
          if (session) {
            // If we got a session, make sure it's stored correctly
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            } catch (storageError) {
              console.error('Error updating session in polling:', storageError);
            }
          }
        }
      } catch (error) {
        console.error('Error in session polling:', error);
      }
    }, 15000); // 15 seconds
    
    return () => {
      if (sessionPollingRef.current) {
        window.clearInterval(sessionPollingRef.current);
        sessionPollingRef.current = null;
      }
    };
  }, []);
};

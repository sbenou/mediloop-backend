
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { getSessionFromStorage } from "@/lib/supabase";

export const useUserSession = () => {
  const [localLoading, setLocalLoading] = useState(true);
  const [hasVisibleSession, setHasVisibleSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      console.log("UserMenu: Checking session");
      
      const storedSession = getSessionFromStorage();
      if (storedSession?.user) {
        console.log("UserMenu: Found valid session in storage:", storedSession.user.id);
        setHasVisibleSession(true);
        setLocalLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session in UserMenu:", error);
          setHasVisibleSession(false);
        } else if (data.session) {
          console.log("UserMenu: Found session via API:", data.session.user.id);
          setHasVisibleSession(!!data.session);
          
          if (data.session && !storedSession) {
            console.log("Session found in API but not in storage, storing it");
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
              window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
            } catch (storageError) {
              console.error("Error storing session:", storageError);
            }
          }
        } else {
          console.log("UserMenu: No session found via API");
          setHasVisibleSession(false);
        }
      } catch (error) {
        console.error("Error checking session in UserMenu:", error);
        setHasVisibleSession(false);
      } finally {
        setLocalLoading(false);
      }
    };
    
    checkSession();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("UserMenu: Page became visible, checking session");
        if (!hasVisibleSession) {
          setLocalLoading(true);
        }
        checkSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleTokenUpdate = () => {
      console.log("UserMenu: Auth token update event received");
      checkSession();
    };
    
    window.addEventListener('supabase:auth:token:update', handleTokenUpdate);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('auth-token') || e.key === 'last_auth_event')) {
        console.log("Auth storage changed, rechecking session");
        checkSession();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('supabase:auth:token:update', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [hasVisibleSession]);

  return { localLoading, hasVisibleSession };
};

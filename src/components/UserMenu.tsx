
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "./user-menu/UserAvatar";
import { UserMenuItems } from "./user-menu/UserMenuItems";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, memo, useState, useEffect } from 'react';
import { supabase, getSessionFromStorage } from "@/lib/supabase";

const UserMenu = memo(() => {
  const { isAuthenticated, isLoading, profile, user } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [hasVisibleSession, setHasVisibleSession] = useState(false);
  const navigate = useNavigate();
  
  // Enhanced session check on mount and visibility change
  useEffect(() => {
    const checkSession = async () => {
      // First check local storage (fastest)
      const storedSession = getSessionFromStorage();
      if (storedSession?.user) {
        setHasVisibleSession(true);
        setLocalLoading(false);
        return;
      }
      
      // If not in storage, check API (slower)
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session in UserMenu:", error);
          setHasVisibleSession(false);
        } else {
          setHasVisibleSession(!!data.session);
          
          // If we have a session from API but not in storage, store it
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
        }
      } catch (error) {
        console.error("Error checking session in UserMenu:", error);
        setHasVisibleSession(false);
      } finally {
        setLocalLoading(false);
      }
    };
    
    checkSession();
    
    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for custom auth token events
    const handleTokenUpdate = () => {
      checkSession();
    };
    
    window.addEventListener('supabase:auth:token:update', handleTokenUpdate);
    
    // Listen for storage events (for cross-tab sync)
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
  }, []);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  // Prevent flashing by showing skeleton only during real loading states
  // and not during tab switches with a known session
  const loadingState = isLoading || localLoading;
  const shouldShowSkeleton = loadingState && !hasVisibleSession;

  // Show skeleton while loading and no visible session
  if (shouldShowSkeleton) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  // Show login button if not authenticated and not loading
  if (!isAuthenticated && !loadingState) {
    return (
      <button
        onClick={handleNavigateToLogin}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  // Show user menu if authenticated or we have a visible session
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer outline-none"
          aria-label="User menu"
        >
          <UserAvatar userProfile={profile} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={5}
        className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;

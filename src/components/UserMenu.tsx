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
import { useCallback, memo, useState, useEffect, useRef } from 'react';
import { supabase, getSessionFromStorage } from "@/lib/supabase";

const UserMenu = memo(() => {
  const { isAuthenticated, isLoading, profile, user } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [hasVisibleSession, setHasVisibleSession] = useState(false);
  const checkTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  
  // Enhanced session check with cookie support and multiple fallbacks
  const checkSession = useCallback(async (skipApi = false) => {
    // Try getting from cookies/localStorage first (fastest)
    const storedSession = getSessionFromStorage();
    
    if (storedSession?.user) {
      setHasVisibleSession(true);
      setLocalLoading(false);
      return true;
    }
    
    // Skip API check if requested (for frequent checks)
    if (skipApi) {
      setHasVisibleSession(false);
      setLocalLoading(false);
      return false;
    }
    
    // If not in storage, check API (slower)
    try {
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;
      
      setHasVisibleSession(hasSession);
      return hasSession;
    } catch (error) {
      console.error("Error checking session in UserMenu:", error);
      return false;
    } finally {
      setLocalLoading(false);
    }
  }, []);
  
  // Check for session on mount and set up listeners
  useEffect(() => {
    // Immediately check for a session, but don't block rendering
    checkSession();
    
    // Set up a periodic check when tab is visible
    const checkInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        // Skip API call for frequent checks
        checkSession(true);
      }
    }, 3000);
    
    // Check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    
    // Handle auth-related events
    const handleAuthEvent = () => {
      // Clear any pending timeout to avoid race conditions
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
      
      // Add a small delay to allow storage to settle
      checkTimeoutRef.current = window.setTimeout(() => {
        checkSession();
        checkTimeoutRef.current = null;
      }, 100);
    };
    
    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('supabase:auth:update', handleAuthEvent);
    window.addEventListener('supabase:auth:signed_in', handleAuthEvent);
    window.addEventListener('supabase:auth:signed_out', handleAuthEvent);
    window.addEventListener('supabase:auth:refreshed', handleAuthEvent);
    
    // Storage events for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('auth-token') || e.key === 'supabase_auth_event') {
        handleAuthEvent();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('supabase:auth:update', handleAuthEvent);
      window.removeEventListener('supabase:auth:signed_in', handleAuthEvent);
      window.removeEventListener('supabase:auth:signed_out', handleAuthEvent);
      window.removeEventListener('supabase:auth:refreshed', handleAuthEvent);
      window.removeEventListener('storage', handleStorageChange);
      
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
      
      window.clearInterval(checkInterval);
    };
  }, [checkSession]);

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

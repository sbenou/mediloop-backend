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
import { supabase } from "@/lib/supabase";
import { getSessionFromStorage } from "@/lib/supabase";

const UserMenu = memo(() => {
  const { isAuthenticated, isLoading, profile, user } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [hasVisibleSession, setHasVisibleSession] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
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

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleNavigateToSettings = useCallback(() => {
    navigate('/settings?tab=profile');
    setMenuOpen(false);
  }, [navigate]);

  const shouldShowSkeleton = isLoading && localLoading && !hasVisibleSession;

  if (shouldShowSkeleton) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading && !localLoading && !hasVisibleSession) {
    return (
      <button
        onClick={handleNavigateToLogin}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <div className="flex items-center space-x-2">
        <div>
          <UserAvatar userProfile={profile} canUpload={true} />
        </div>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="flex items-center space-x-1 hover:opacity-80 transition-opacity cursor-pointer outline-none text-sm"
            aria-label="User menu"
          >
            <span className="font-medium">{profile?.full_name || 'User'}</span>
          </button>
        </DropdownMenuTrigger>
      </div>
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

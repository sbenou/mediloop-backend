
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { supabase, clearAllAuthStorage } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { User, CreditCard, Bell, LogOut } from "lucide-react";

export const UserMenuItems = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useRecoilState(authState);
  const userRole = auth.profile?.role || 'user';

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from UserMenuItems");
      
      // First, clear local auth state before API call
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      
      // Broadcast logout event to other tabs BEFORE API call
      try {
        const logoutEvent = { type: 'LOGOUT', timestamp: Date.now() };
        localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
        // Force the storage event
        localStorage.removeItem('last_auth_event');
        localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
      } catch (eventError) {
        console.error('Error broadcasting logout event:', eventError);
      }
      
      // Force clear all auth storage (localStorage, sessionStorage, and cookies)
      clearAllAuthStorage();
      
      // Enhanced cookie clearing with more aggressive approach
      // This is a more forceful approach to clearing cookies
      const allCookies = document.cookie.split(';');
      
      // Clear each cookie with multiple domain/path combinations to ensure they're all removed
      allCookies.forEach(cookie => {
        const name = cookie.trim().split('=')[0];
        if (!name) return;
        
        // Common paths that might have been set for auth cookies
        const paths = ['/', '/login', '/auth', '/dashboard', '/profile', '/api', ''];
        
        // Get the hostname parts for domain clearing
        const hostParts = window.location.hostname.split('.');
        const domains = [];
        
        // Add main domain
        domains.push(window.location.hostname);
        
        // Add parent domain if exists (for subdomains)
        if (hostParts.length > 2) {
          domains.push(`.${hostParts.slice(-2).join('.')}`);
        }
        
        // Add root domain with dot prefix
        domains.push(`.${window.location.hostname}`);
        
        // Add empty domain (current domain only)
        domains.push('');
        
        // Try all combinations of domains and paths
        domains.forEach(domain => {
          paths.forEach(path => {
            // Try multiple expiration approaches
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0; secure;`;
            document.cookie = `${name}=; path=${path}${domain ? `; domain=${domain}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=-1; secure;`;
            
            // Also try with SameSite=None for cross-origin cookies
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; SameSite=None; max-age=0; secure;`;
          });
        });
        
        // Last resort: try setting without path or domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      });
      
      // Sign out from Supabase - this will clear the session on the server
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Force a hard redirect to ensure complete logout and fresh page load
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  // Get the appropriate route prefix based on user role
  const getRoutePrefix = () => {
    if (userRole === 'superadmin') {
      return '/superadmin';
    } else if (userRole === 'pharmacist') {
      return '/pharmacy';
    }
    return '';
  };

  // Use useMemo to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    const routePrefix = getRoutePrefix();
    
    return (
      <>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate(`${routePrefix}/upgrade`)}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Upgrade to Pro</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => {
            console.log(`Navigating to profile route: ${routePrefix}/profile`);
            navigate(`${routePrefix}/profile`);
          }}>
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`${routePrefix}/billing`)}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`${routePrefix}/notifications`)}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </>
    );
  }, [navigate, userRole]);

  return menuItems;
};

export default UserMenuItems;

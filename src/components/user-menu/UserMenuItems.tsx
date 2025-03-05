
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
      
      // Enhanced cookie clearing - clear all cookies that might be related to authentication
      // Get all cookies
      const allCookies = document.cookie.split(';');
      
      // Clear each cookie with multiple domain/path combinations to ensure they're all removed
      allCookies.forEach(cookie => {
        const name = cookie.trim().split('=')[0];
        if (!name) return;
        
        // Common paths that might have been set for auth cookies
        const paths = ['/', '/login', '/auth', '/dashboard'];
        
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
        
        // Clear cookie with all path/domain combinations
        paths.forEach(path => {
          // Clear with no specific domain (current domain)
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; max-age=0; secure;`;
          
          // Clear with specific domains
          domains.forEach(domain => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; max-age=0; secure;`;
          });
          
          // Also try with SameSite=None for cross-origin cookies
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; max-age=0; secure;`;
        });
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

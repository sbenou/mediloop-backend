
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
      
      // First, do a hard clear of all browser storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
      
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
      
      // Get all cookies and delete them with various techniques 
      const allCookies = document.cookie.split(';');
      const domain = window.location.hostname;
      
      // Clear each cookie with multiple approaches
      allCookies.forEach(cookie => {
        const name = cookie.trim().split('=')[0];
        if (!name) return;
        
        // ENHANCED: Improved cookie clearing methods that work better with developer tools
        
        // Add document.cookie clears with all possible combinations
        // Basic cookie clearing with multiple path/domain variations
        ["/", "/login", "/dashboard", "", "/api", "/auth", null].forEach(path => {
          // Try with path alone
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'};`;
          
          // Try with path and domain
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}; domain=${domain};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}; domain=.${domain};`;
          
          // Try with root domain variations
          if (domain.includes('.')) {
            const rootDomain = domain.split('.').slice(-2).join('.');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}; domain=.${rootDomain};`;
          }
          
          // Try with short max-age approach (most reliable for dev tools)
          document.cookie = `${name}=; max-age=-1; path=${path || '/'};`;
          document.cookie = `${name}=; max-age=-99999; path=${path || '/'};`;
          
          // Try with all SameSite variations
          ["None", "Lax", "Strict"].forEach(sameSite => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}; SameSite=${sameSite}; ${sameSite === 'None' ? 'Secure;' : ''} max-age=-1;`;
          });
        });
        
        // Try absolute expiration methods
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        document.cookie = `${name}=; max-age=-1;`;
        document.cookie = `${name}=; max-age=0;`;
        
        // Try with invalid value to force browser to delete
        document.cookie = `${name}=invalid; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Also clear the selectedCountry from localStorage to force the CountrySelector to appear on next visit
      try {
        localStorage.removeItem('selectedCountry');
      } catch (err) {
        console.error("Error removing selectedCountry:", err);
      }
      
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
      window.location.href = "/login";
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
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 items-center">
            <p className="text-sm font-normal">{auth.profile?.email || 'user@example.com'}</p>
            <p className="text-xs font-bold">{userRole === 'user' ? 'Patient' : userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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
  }, [navigate, userRole, auth.profile, setAuth]);

  return menuItems;
};

export default UserMenuItems;

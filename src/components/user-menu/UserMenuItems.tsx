
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
      
      // First, sign out from Supabase - this will clear the session on the server
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
      // Clear auth state in application state
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      
      // Force clear all auth storage (localStorage, sessionStorage, and cookies)
      clearAllAuthStorage();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Force a hard redirect to ensure complete logout
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

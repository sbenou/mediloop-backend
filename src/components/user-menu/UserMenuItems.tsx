
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
import { User, CreditCard, Bell, LogOut, Store } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

export const UserMenuItems = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useRecoilState(authState);
  const { isPharmacist } = useAuth();
  const userRole = auth.profile?.role || 'user';
  
  // Ensure to report role status - critical debugging
  console.log('UserMenuItems rendering with userRole:', userRole);
  console.log('UserMenuItems userRole === pharmacist check:', userRole === 'pharmacist');
  console.log('UserMenuItems isPharmacist from hook:', isPharmacist);
  console.log('UserMenuItems profile data:', auth.profile);
  
  // Force check for pharmacist role from multiple sources for debugging
  const isUserPharmacist = userRole === 'pharmacist' || isPharmacist || auth.profile?.role === 'pharmacist';
  console.log('UserMenuItems FINAL isUserPharmacist check:', isUserPharmacist);

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from UserMenuItems");
      
      // First, clear all local auth state before API call
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      
      // Clear country selection to force the country selector on next visit
      try {
        localStorage.removeItem('selectedCountry');
      } catch (e) {
        console.error("Error removing selectedCountry:", e);
      }
      
      // Force clear all auth storage (localStorage, sessionStorage, and cookies)
      clearAllAuthStorage();
      
      // Broadcast logout event to other tabs
      try {
        const logoutEvent = { type: 'LOGOUT', timestamp: Date.now() };
        localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
      } catch (eventError) {
        console.error('Error broadcasting logout event:', eventError);
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
    
    // Enhanced debugging
    console.log('Current user role in UserMenuItems:', userRole);
    console.log('Profile data:', auth.profile);
    console.log('Is pharmacist check (multiple sources):', 
      userRole === 'pharmacist', 
      isPharmacist, 
      auth.profile?.role === 'pharmacist',
      isUserPharmacist
    );
    
    return (
      <>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 items-center">
            <p className="text-sm font-normal">{auth.profile?.email || 'user@example.com'}</p>
            <p className="text-xs font-medium">{userRole === 'user' ? 'Patient' : userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate(`${routePrefix}/upgrade`)}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Upgrade to Pro</span>
          </DropdownMenuItem>
          
          {/* Explicitly add Pharmacy Profile link right after Upgrade to Pro */}
          {isUserPharmacist && (
            <DropdownMenuItem onClick={() => {
              console.log('Navigating to pharmacy profile from UserMenuItems');
              navigate('/pharmacy/profile');
            }} className="pharmacy-profile-link" data-testid="pharmacy-profile-link">
              <Store className="mr-2 h-4 w-4" />
              <span>Pharmacy Profile</span>
            </DropdownMenuItem>
          )}
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
  }, [navigate, userRole, auth.profile, setAuth, isPharmacist, isUserPharmacist]);

  return menuItems;
};

export default UserMenuItems;

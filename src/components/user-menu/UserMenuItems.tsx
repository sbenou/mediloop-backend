
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { supabase, clearAllAuthStorage } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { 
  User, 
  CreditCard, 
  LogOut, 
  Store, 
  Home, 
  ShoppingBag, 
  FileText, 
  Video, 
  Settings,
  Bell,
  Users,
  HeartPulse,
  Calendar,
  BarChart,
  Loader
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const UserMenuItems = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useRecoilState(authState);
  const { isPharmacist, userRole: hookUserRole, profile } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Ensure we have a userRole, with multiple fallbacks
  // Use profile.role as the highest priority source
  const userRole = profile?.role || auth.profile?.role || hookUserRole || 'user';
  
  // Check if we're on the activities or notifications page
  const isActivitiesPage = location.pathname.includes('/activities') || 
                          location.pathname.includes('/notifications');
  
  // Debugging logs
  console.log('[UserMenuItems][DEBUG] UserMenuItems rendering with userRole:', userRole);
  console.log('[UserMenuItems][DEBUG] isPharmacist from hook:', isPharmacist);
  console.log('[UserMenuItems][DEBUG] profile data:', auth.profile);
  
  // Force check for pharmacist role for debugging
  const isUserPharmacist = userRole === 'pharmacist' || isPharmacist || auth.profile?.role === 'pharmacist' || profile?.role === 'pharmacist';
  console.log('[UserMenuItems][DEBUG] FINAL isUserPharmacist check:', isUserPharmacist);

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      console.log("[UserMenuItems][DEBUG] Logout initiated from UserMenuItems");
      
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
        console.error("[UserMenuItems][DEBUG] Error removing selectedCountry:", e);
      }
      
      // Force clear all auth storage
      clearAllAuthStorage();
      
      // Broadcast logout event to other tabs
      try {
        const logoutEvent = { type: 'LOGOUT', timestamp: Date.now() };
        localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
      } catch (eventError) {
        console.error('[UserMenuItems][DEBUG] Error broadcasting logout event:', eventError);
      }
      
      toast({
        title: "Logging out...",
        description: "Please wait while we log you out",
      });
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("[UserMenuItems][DEBUG] Supabase signOut error:", error);
        throw error;
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Clear any navigation flags
      sessionStorage.removeItem('login_successful');
      sessionStorage.removeItem('skip_dashboard_redirect');
      sessionStorage.removeItem('dashboard_redirect_count');
      sessionStorage.removeItem('dashboard_mount_count');
      sessionStorage.removeItem('pharmacy_redirect_count');
      
      // Force a hard redirect to ensure complete logout
      setTimeout(() => {
        window.location.href = "/login";
      }, 300);
    } catch (error) {
      console.error("[UserMenuItems][DEBUG] Logout error:", error);
      setIsNavigating(false);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  // Function to handle navigation with proper path resolution
  const handleNavigation = (path: string) => {
    console.log(`[UserMenuItems][DEBUG] Navigating to ${path} from UserMenuItems`);
    setIsNavigating(true);
    
    // Reset all navigation-related flags
    sessionStorage.removeItem('pharmacy_redirect_count');
    sessionStorage.removeItem('dashboard_redirect_count');
    sessionStorage.removeItem('dashboard_mount_count');
    
    // Set a navigation timestamp to track intentional navigations
    sessionStorage.setItem('menu_navigation_timestamp', Date.now().toString());
        
    if (path.includes('/dashboard')) {
      // Get correct dashboard route based on user role with fallbacks
      // Use profile.role as the highest priority source of truth
      const role = profile?.role || userRole || auth.profile?.role || 'user';
      let dashboardRoute = getDashboardRouteByRole(role);
      
      console.log(`[UserMenuItems][DEBUG] Navigation details:`, {
        role,
        isPharmacist: isUserPharmacist,
        originalPath: path,
        calculatedRoute: dashboardRoute
      });
      
      // Flag to indicate this is an intentional menu navigation
      sessionStorage.setItem('dashboard_navigation_source', 'menu');
      // Ensure skip_dashboard_redirect is also set to prevent loops
      sessionStorage.setItem('skip_dashboard_redirect', 'true');
      
      try {
        // For pharmacists, always ensure correct parameters
        if (isUserPharmacist) {
          console.log("[UserMenuItems][DEBUG] Pharmacist detected, forcing pharmacy dashboard");
          
          // Use setTimeout to ensure session storage is set before navigation
          setTimeout(() => {
            window.location.replace('/dashboard?view=pharmacy&section=dashboard');
          }, 150);
          return;
        }
        
        // For other roles, use the calculated route
        setTimeout(() => {
          window.location.replace(dashboardRoute);
        }, 150);
      } catch (err) {
        console.error("Navigation error:", err);
        setIsNavigating(false);
        
        // Fallback to direct href navigation
        const targetUrl = isUserPharmacist ? 
          '/dashboard?view=pharmacy&section=dashboard' : 
          dashboardRoute;
          
        window.location.href = targetUrl;
      }
    } else {
      // For non-dashboard paths, use React Router navigation
      navigate(path);
      setIsNavigating(false);
    }
  };

  // Generate menu items based on user role
  const getMenuItemsByRole = () => {
    // Default items (patient/user role)
    if (userRole === 'user' || userRole === 'patient') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard?view=home' },
        { icon: User, label: 'Profile', path: '/dashboard?view=profile&profileTab=personal' },
        { icon: ShoppingBag, label: 'Orders', path: '/dashboard?view=orders&ordersTab=orders' },
        { icon: CreditCard, label: 'Payments', path: '/dashboard?view=orders&ordersTab=payments' },
        { icon: FileText, label: 'Prescriptions', path: '/dashboard?view=prescriptions' },
        { icon: HeartPulse, label: 'Consultations', path: '/dashboard?view=teleconsultations' },
        { icon: Bell, label: 'Notifications', path: '/activities' },
        { icon: Settings, label: 'Settings', path: '/settings' }
      ];
    }
    
    // Doctor specific items
    if (userRole === 'doctor') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard?section=dashboard' },
        { icon: User, label: 'Profile', path: '/dashboard?section=profile&profileTab=personal' },
        { icon: Store, label: 'Doctor Profile', path: '/doctor/profile' }, 
        { icon: Users, label: 'Patients', path: '/dashboard?section=patients' },
        { icon: FileText, label: 'Prescriptions', path: '/dashboard?section=prescriptions' },
        { icon: HeartPulse, label: 'Consultations', path: '/dashboard?section=teleconsultations' },
        { icon: Bell, label: 'Notifications', path: '/activities' },
        { icon: Settings, label: 'Settings', path: '/settings' }
      ];
    }
    
    // Pharmacist specific items - always use full pharmacy parameter set
    if (isUserPharmacist) {
      console.log('[UserMenuItems][DEBUG] Generating menu items for pharmacist');
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard?view=pharmacy&section=dashboard' },
        { icon: User, label: 'Profile', path: '/dashboard?view=pharmacy&section=profile&profileTab=personal' },
        { icon: Store, label: 'Pharmacy Profile', path: '/pharmacy/profile', className: 'pharmacy-profile-link' },
        { icon: ShoppingBag, label: 'Orders', path: '/dashboard?view=pharmacy&section=orders' },
        { icon: Users, label: 'Patients', path: '/dashboard?view=pharmacy&section=patients' },
        { icon: FileText, label: 'Prescriptions', path: '/dashboard?view=pharmacy&section=prescriptions' },
        { icon: Bell, label: 'Notifications', path: '/activities' },
        { icon: BarChart, label: 'Analytics', path: '/dashboard?view=pharmacy&section=analytics' },
        { icon: Settings, label: 'Settings', path: '/settings' }
      ];
    }
    
    // Superadmin specific items
    if (userRole === 'superadmin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/superadmin/dashboard' },
        { icon: Users, label: 'Users', path: '/superadmin/users' },
        { icon: Store, label: 'Pharmacies', path: '/superadmin/pharmacies' },
        { icon: HeartPulse, label: 'Doctors', path: '/superadmin/doctors' },
        { icon: ShoppingBag, label: 'Products', path: '/superadmin/products' },
        { icon: Bell, label: 'Notifications', path: '/activities' },
        { icon: Settings, label: 'Settings', path: '/superadmin/settings' }
      ];
    }
    
    // Fallback for unknown roles
    return [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: User, label: 'Profile', path: '/settings?tab=profile' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];
  };

  // Use useMemo to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    const roleSpecificItems = getMenuItemsByRole();
    
    // Enhanced debugging
    console.log('[UserMenuItems][DEBUG] Current user role in UserMenuItems:', userRole);
    console.log('[UserMenuItems][DEBUG] Menu items generated for role:', roleSpecificItems);
    
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
          {roleSpecificItems.map((item, index) => (
            <DropdownMenuItem 
              key={`${item.label}-${index}`} 
              data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`[UserMenuItems][DEBUG] Clicking on ${item.label} menu item with path ${item.path}`);
                handleNavigation(item.path);
              }}
              className={item.className}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <item.icon className="mr-2 h-4 w-4" />
              )}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          data-testid="menu-item-logout"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Log out</span>
        </DropdownMenuItem>
      </>
    );
  }, [userRole, auth.profile, setAuth, isPharmacist, isUserPharmacist, isActivitiesPage, navigate, profile, isNavigating]);

  return menuItems;
};

export default UserMenuItems;

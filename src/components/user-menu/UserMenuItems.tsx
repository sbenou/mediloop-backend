
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
  BarChart
} from "lucide-react";
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

  // Generate menu items based on user role
  const getMenuItemsByRole = () => {
    // Default items (patient/user role)
    if (userRole === 'user' || userRole === 'patient') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard?view=home' },
        { icon: User, label: 'Profile', path: '/dashboard?view=profile' },
        { icon: ShoppingBag, label: 'Orders', path: '/dashboard?view=orders' },
        { icon: FileText, label: 'Prescriptions', path: '/dashboard?view=prescriptions' },
        { icon: Video, label: 'Teleconsultations', path: '/dashboard?view=teleconsultations' },
        { icon: Settings, label: 'Settings', path: '/dashboard?view=settings' }
      ];
    }
    
    // Doctor specific items
    if (userRole === 'doctor') {
      return [
        { icon: Home, label: 'Dashboard', path: '/doctor?section=dashboard' },
        { icon: Users, label: 'Patients', path: '/doctor?section=patients' },
        { icon: FileText, label: 'Prescriptions', path: '/doctor?section=prescriptions' },
        { icon: Video, label: 'Teleconsultations', path: '/doctor?section=teleconsultations' },
        { icon: Calendar, label: 'Appointments', path: '/doctor?section=appointments' },
        { icon: User, label: 'Profile', path: '/doctor?section=profile' },
        { icon: Settings, label: 'Settings', path: '/doctor?section=settings' }
      ];
    }
    
    // Pharmacist specific items
    if (isUserPharmacist) {
      return [
        { icon: Home, label: 'Dashboard', path: '/pharmacy?section=dashboard' },
        { icon: Store, label: 'Pharmacy Profile', path: '/pharmacy?section=profile' },
        { icon: ShoppingBag, label: 'Orders', path: '/pharmacy?section=orders' },
        { icon: Users, label: 'Customers', path: '/pharmacy?section=customers' },
        { icon: FileText, label: 'Prescriptions', path: '/pharmacy?section=prescriptions' },
        { icon: BarChart, label: 'Analytics', path: '/pharmacy?section=analytics' },
        { icon: Settings, label: 'Settings', path: '/pharmacy?section=settings' }
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
        { icon: Settings, label: 'Settings', path: '/superadmin/settings' }
      ];
    }
    
    // Fallback for unknown roles
    return [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: User, label: 'Profile', path: '/settings?tab=profile' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];
  };

  // Use useMemo to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    const roleSpecificItems = getMenuItemsByRole();
    
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
          {roleSpecificItems.map((item, index) => (
            <DropdownMenuItem 
              key={`${item.label}-${index}`} 
              onClick={() => {
                console.log(`Navigating to ${item.path} from UserMenuItems`);
                navigate(item.path);
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
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

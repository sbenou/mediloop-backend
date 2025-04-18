import React from 'react';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
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
  BarChart,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

export const UserMenuItems = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useRecoilState(authState);
  const { isPharmacist } = useAuth();
  const userRole = auth.profile?.role || 'user';
  
  // Check if we're on the activities or notifications page
  const isActivitiesPage = location.pathname.includes('/activities') || 
                          location.pathname.includes('/notifications');
  
  // Debugging logs
  console.log('UserMenuItems rendering with userRole:', userRole);
  console.log('UserMenuItems isPharmacist from hook:', isPharmacist);
  console.log('UserMenuItems profile data:', auth.profile);
  
  // Force check for pharmacist role for debugging
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
      
      // Force clear all auth storage
      clearAllAuthStorage();
      
      // Broadcast logout event to other tabs
      try {
        const logoutEvent = { type: 'LOGOUT', timestamp: Date.now() };
        localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
      } catch (eventError) {
        console.error('Error broadcasting logout event:', eventError);
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Force a hard redirect to ensure complete logout
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

  // Function to handle navigation with proper path resolution - FIXED to handle direct paths properly
  const handleNavigation = (path: string) => {
    console.log(`Navigating to ${path} from UserMenuItems`);
    
    // Special case for /account - ALWAYS navigate directly
    if (path === '/account') {
      console.log('Direct navigation to /account page');
      navigate('/account');
      return;
    }
    
    // For other direct paths like /settings, navigate directly
    if (path.startsWith('/') && !path.includes('?')) {
      navigate(path);
      return;
    }
    
    // If on activities page and trying to go to dashboard with params,
    // ensure we navigate properly
    if (isActivitiesPage && path.startsWith('/dashboard?')) {
      navigate(path);
    } else {
      navigate(path);
    }
  };

  // Generate menu items based on user role - this now exactly matches the sidebar navigation
  const getMenuItemsByRole = () => {
    // Default items (patient/user role)
    if (userRole === 'user' || userRole === 'patient') {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Award, label: 'Account', path: '/account' }, // Direct path to /account
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
        { icon: Award, label: 'Account', path: '/account' }, // Direct path to /account
        { icon: User, label: 'Profile', path: '/dashboard?section=profile&profileTab=personal' },
        { icon: Store, label: 'Doctor Profile', path: '/doctor/profile' },
        { icon: Users, label: 'Patients', path: '/dashboard?section=patients' },
        { icon: FileText, label: 'Prescriptions', path: '/dashboard?section=prescriptions' },
        { icon: HeartPulse, label: 'Consultations', path: '/dashboard?section=teleconsultations' },
        { icon: Bell, label: 'Notifications', path: '/activities' },
        { icon: Settings, label: 'Settings', path: '/settings' }
      ];
    }
    
    // Pharmacist specific items
    if (isPharmacist) {
      return [
        { icon: Home, label: 'Dashboard', path: '/dashboard?view=pharmacy&section=dashboard' },
        { icon: Award, label: 'Account', path: '/account' }, // Direct path to /account
        { icon: User, label: 'Profile', path: '/dashboard?view=profile&profileTab=personal' },
        { icon: Store, label: 'Pharmacy Profile', path: '/pharmacy/profile' },
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
        { icon: Award, label: 'Account', path: '/account' }, // Direct path to /account
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
      { icon: Award, label: 'Account', path: '/account' }, // Direct path to /account
      { icon: User, label: 'Profile', path: '/settings?tab=profile' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];
  };

  // Use useMemo to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    const roleSpecificItems = getMenuItemsByRole();
    
    // Enhanced debugging
    console.log('Current user role in UserMenuItems:', userRole);
    console.log('Menu items generated for role:', roleSpecificItems);
    
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
                handleNavigation(item.path);
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
  }, [navigate, userRole, auth.profile, setAuth, isPharmacist, isUserPharmacist, isActivitiesPage]);

  return menuItems;
};

export default UserMenuItems;

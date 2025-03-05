
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Home, User, ShoppingBag, FileText, Settings, Calendar, 
  CreditCard, Bell, LogOut, ChevronDown, CreditCard as Payment,
  UserCircle, MapPin, Store, Heart, Users
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserAvatar from "../user-menu/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { clearAllAuthStorage } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const UnifiedSidebar = () => {
  const { userRole, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Set open states based on URL
  useEffect(() => {
    if (location.pathname.includes('/my-orders') || location.search.includes('view=orders')) {
      setIsOrdersOpen(true);
    }
    
    if (location.pathname.includes('/profile') || location.search.includes('view=profile')) {
      setIsProfileOpen(true);
    }
  }, [location.pathname, location.search]);

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log("Logout initiated from UnifiedSidebar");
      
      // First, do a hard clear of all browser storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
      
      // Force clear all auth storage (localStorage, sessionStorage, and cookies)
      clearAllAuthStorage();
      
      // Clear cookies with the same enhanced methods as in UserMenuItems
      const allCookies = document.cookie.split(';');
      const domain = window.location.hostname;
      
      allCookies.forEach(cookie => {
        const name = cookie.trim().split('=')[0];
        if (!name) return;
        
        ["/", "/login", "/dashboard", "", "/api", "/auth", null].forEach(path => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}; domain=${domain};`;
          document.cookie = `${name}=; max-age=-1; path=${path || '/'};`;
        });
        
        document.cookie = `${name}=; max-age=-1;`;
      });
      
      // Also clear the selectedCountry from localStorage to force the CountrySelector to appear on next visit
      try {
        localStorage.removeItem('selectedCountry');
      } catch (err) {
        console.error("Error removing selectedCountry:", err);
      }
      
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

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const isSubPathActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const isBasePathMatch = location.pathname === basePath;
      
      if (!isBasePathMatch) return false;
      
      const searchParams = new URLSearchParams(queryString);
      const currentSearchParams = new URLSearchParams(location.search);
      
      for (const [key, value] of searchParams.entries()) {
        if (currentSearchParams.get(key) !== value) {
          return false;
        }
      }
      
      return true;
    }
    
    return location.pathname === path;
  };

  const platformMenuItems = [
    {
      label: 'Dashboard',
      icon: <Home className="w-5 h-5 mr-3" />,
      path: '/dashboard',
      active: isLinkActive('/dashboard')
    }
  ];
  
  const adminMenuItems = [
    {
      label: 'Settings',
      icon: <Settings className="w-5 h-5 mr-3" />,
      path: '/settings',
      active: isLinkActive('/settings')
    }
  ];

  const ordersSubItems = [
    {
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4 mr-3" />,
      path: '/my-orders?view=orders',
      active: isSubPathActive('/my-orders?view=orders') || 
             (location.pathname === '/my-orders' && (!location.search || location.search === ''))
    },
    {
      label: 'Payments',
      icon: <Payment className="w-4 h-4 mr-3" />,
      path: '/my-orders?view=payments',
      active: isSubPathActive('/my-orders?view=payments')
    }
  ];
  
  const profileSubItems = [
    {
      label: 'Personal Details',
      icon: <UserCircle className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=personal',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=personal')
    },
    {
      label: 'Addresses',
      icon: <MapPin className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=addresses',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=addresses')
    },
    {
      label: 'Pharmacy',
      icon: <Store className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=pharmacy',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=pharmacy')
    },
    {
      label: 'My Doctor',
      icon: <Heart className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=doctor',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=doctor')
    },
    {
      label: 'Next of Kin',
      icon: <Users className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=nextofkin',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=nextofkin')
    }
  ];

  // Get the appropriate route prefix based on user role
  const getRoutePrefix = () => {
    if (userRole === 'superadmin') {
      return '/superadmin';
    } else if (userRole === 'pharmacist') {
      return '/pharmacy';
    }
    return '';
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <UserAvatar 
              userProfile={{
                id: null,
                full_name: 'Mediloop',
                email: null,
                avatar_url: null,
                role: 'organization',
                role_id: null,
                date_of_birth: null,
                city: null,
                auth_method: null,
                is_blocked: null,
                doctor_stamp_url: null,
                doctor_signature_url: null,
                cns_card_front: null,
                cns_card_back: null,
                cns_number: null,
                deleted_at: null,
                created_at: null,
                updated_at: null,
                license_number: null
              }} 
              squared={true} 
              canUpload={true} 
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Mediloop</h3>
            <p className="text-xs text-muted-foreground">Healthcare Platform</p>
          </div>
        </div>
      </div>
      
      {/* Sidebar Sections */}
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Platform</p>
        </div>
        
        <nav className="space-y-1 px-2">
          {platformMenuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                item.active 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          
          {/* Profile Collapsible Section */}
          <Collapsible 
            open={isProfileOpen} 
            onOpenChange={setIsProfileOpen}
            className="w-full"
          >
            <CollapsibleTrigger className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm ${
              location.search.includes('view=profile')
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:bg-gray-100'
            }`}>
              <div className="flex items-center">
                <User className="w-5 h-5 mr-3" />
                <span>Profile</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-5 space-y-1 mt-1">
              {profileSubItems.map((subItem, index) => (
                <Link
                  key={index}
                  to={subItem.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm ${
                    subItem.active 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:bg-gray-100'
                  }`}
                >
                  {subItem.icon}
                  {subItem.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          {/* Orders Collapsible Section */}
          <Collapsible 
            open={isOrdersOpen} 
            onOpenChange={setIsOrdersOpen}
            className="w-full"
          >
            <CollapsibleTrigger className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm ${
              location.pathname.includes('/my-orders')
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:bg-gray-100'
            }`}>
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-3" />
                <span>Orders</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOrdersOpen ? 'transform rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-5 space-y-1 mt-1">
              {ordersSubItems.map((subItem, index) => (
                <Link
                  key={index}
                  to={subItem.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm ${
                    subItem.active 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:bg-gray-100'
                  }`}
                >
                  {subItem.icon}
                  {subItem.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          <Link
            to="/teleconsultations"
            className={`flex items-center px-3 py-2 rounded-md text-sm ${
              isLinkActive('/teleconsultations') 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5 mr-3" />
            Teleconsultations
          </Link>
        </nav>
        
        {/* Admin Section */}
        <div className="px-3 mb-2 mt-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">Admin</p>
        </div>
        
        <nav className="space-y-1 px-2">
          {adminMenuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                item.active 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* User Profile - with dropdown menu aligned to the right */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors">
              <UserAvatar userProfile={profile} squared={true} canUpload={true} />
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email || 'user@example.com'}</p>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 items-center">
                <p className="text-sm font-normal">{profile?.email || 'user@example.com'}</p>
                <p className="text-xs font-medium">{userRole === 'user' ? 'Patient' : userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = `${getRoutePrefix()}/upgrade`}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = `${getRoutePrefix()}/profile`}>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `${getRoutePrefix()}/billing`}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default UnifiedSidebar;

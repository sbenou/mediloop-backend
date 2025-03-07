import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Home, User, ShoppingBag, FileText, Settings, Calendar, 
  CreditCard, Bell, LogOut, ChevronDown, CreditCard as Payment,
  UserCircle, MapPin, Store, Heart, Users, Pill, SquareUser,
  FileIcon
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { clearAllAuthStorage } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const UnifiedSidebar = () => {
  const { userRole, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (location.pathname.includes('/my-orders') || location.search.includes('view=orders')) {
      setIsOrdersOpen(true);
    }
    
    if (location.pathname.includes('/profile') || location.search.includes('view=profile')) {
      setIsProfileOpen(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from UnifiedSidebar");
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
      
      clearAllAuthStorage();
      
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
      path: '/dashboard?view=orders&ordersTab=orders',
      active: (location.pathname === '/dashboard' && 
             location.search.includes('view=orders') && 
             (!location.search.includes('ordersTab=') || location.search.includes('ordersTab=orders')))
    },
    {
      label: 'Payments',
      icon: <Payment className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=orders&ordersTab=payments',
      active: (location.pathname === '/dashboard' && 
             location.search.includes('view=orders') && 
             location.search.includes('ordersTab=payments'))
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

  const getRoutePrefix = () => {
    if (userRole === 'superadmin') {
      return '/superadmin';
    } else if (userRole === 'pharmacist') {
      return '/dashboard?view=pharmacy&section=';
    }
    return '';
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log("Avatar file selected:", file.name);
    toast({
      title: "Avatar update",
      description: "Profile image update started",
    });
    
    // Here you would typically upload the file to your storage
    // This is a placeholder for the actual implementation
  };

  const getUserInitials = () => {
    if (!profile?.full_name) return '';
    const names = profile.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handlePharmacistNavigation = (section: string) => {
    navigate(`/dashboard?view=pharmacy&section=${section}`);
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Avatar className="h-10 w-10 rounded-md bg-[#9b87f5]">
            <AvatarFallback className="rounded-md text-white">
              <FileIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">Mediloop</h3>
            <p className="text-xs text-muted-foreground">Healthcare Platform</p>
          </div>
        </div>
      </div>
      
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
          
          <Collapsible 
            open={isProfileOpen} 
            onOpenChange={(isOpen) => {
              setIsProfileOpen(isOpen);
            }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {subItem.icon}
                  {subItem.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible 
            open={isOrdersOpen} 
            onOpenChange={(isOpen) => {
              setIsOrdersOpen(isOpen);
            }}
            className="w-full"
          >
            <CollapsibleTrigger className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm ${
              (location.pathname === '/dashboard' && location.search.includes('view=orders')) ||
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
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {subItem.icon}
                  {subItem.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          {(userRole === 'patient' || userRole === 'doctor' || userRole === 'pharmacist') && (
            <Link
              to={userRole === 'pharmacist' 
                ? '/dashboard?view=pharmacy&section=prescriptions' 
                : '/dashboard?view=prescriptions'}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                (location.pathname === '/dashboard' && 
                  (location.search.includes('view=prescriptions') || 
                   (userRole === 'pharmacist' && location.search.includes('view=pharmacy') && location.search.includes('section=prescriptions')))) ||
                location.pathname.includes('/my-prescriptions')
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              <Pill className="w-5 h-5 mr-3" />
              Prescriptions
            </Link>
          )}
          
          {userRole === 'pharmacist' && (
            <Link
              to="/dashboard?view=pharmacy&section=patients"
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                (location.pathname === '/dashboard' && 
                location.search.includes('view=pharmacy') && 
                location.search.includes('section=patients'))
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Patients
            </Link>
          )}
          
          {userRole !== 'pharmacist' && (
            <Link
              to="/dashboard?view=teleconsultations"
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                (location.pathname === '/dashboard' && location.search.includes('view=teleconsultations')) ||
                location.pathname.includes('/teleconsultations')
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Teleconsultations
            </Link>
          )}
        </nav>
        
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
      
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors">
              <div>
                <UserAvatar 
                  userProfile={profile} 
                  canUpload={true} 
                  onAvatarClick={handleAvatarClick} 
                  fallbackText={getUserInitials()} 
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
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
              <DropdownMenuItem onClick={() => navigate('/upgrade')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(`/dashboard?view=profile&profileTab=personal`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/dashboard?view=orders&ordersTab=payments`)}>
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


import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Home, User, ShoppingBag, FileText, Settings, Calendar, MapPin, Building, Stethoscope, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserAvatar from "../user-menu/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Bell, LogOut } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const UnifiedSidebar = () => {
  const { userRole, profile } = useAuth();
  const location = useLocation();

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const isProfileSubitemActive = (profileTab: string) => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === '/dashboard' && 
           searchParams.get('view') === 'profile' && 
           searchParams.get('profileTab') === profileTab;
  };

  const platformMenuItems = [
    {
      label: 'Dashboard',
      icon: <Home className="w-5 h-5 mr-3" />,
      path: '/dashboard',
      active: isLinkActive('/dashboard')
    },
    {
      label: 'Orders',
      icon: <ShoppingBag className="w-5 h-5 mr-3" />,
      path: '/my-orders',
      active: isLinkActive('/my-orders')
    },
    {
      label: 'Teleconsultations',
      icon: <Calendar className="w-5 h-5 mr-3" />,
      path: '/teleconsultations',
      active: isLinkActive('/teleconsultations')
    }
  ];
  
  const profileSubItems = [
    {
      label: 'Personal Details',
      icon: <User className="w-4 h-4 mr-2" />,
      path: '/dashboard?view=profile&profileTab=personal',
      active: isProfileSubitemActive('personal')
    },
    {
      label: 'Addresses',
      icon: <MapPin className="w-4 h-4 mr-2" />,
      path: '/dashboard?view=profile&profileTab=addresses',
      active: isProfileSubitemActive('addresses')
    },
    {
      label: 'Pharmacy',
      icon: <Building className="w-4 h-4 mr-2" />,
      path: '/dashboard?view=profile&profileTab=pharmacy',
      active: isProfileSubitemActive('pharmacy')
    },
    {
      label: 'Doctor',
      icon: <Stethoscope className="w-4 h-4 mr-2" />,
      path: '/dashboard?view=profile&profileTab=doctor',
      active: isProfileSubitemActive('doctor')
    },
    {
      label: 'Next of Kin',
      icon: <Users className="w-4 h-4 mr-2" />,
      path: '/dashboard?view=profile&profileTab=nextofkin',
      active: isProfileSubitemActive('nextofkin')
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
          
          {/* Profile link with subitems */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer ${
                  location.pathname === '/dashboard' && new URLSearchParams(location.search).get('view') === 'profile'
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-gray-100'
                }`}>
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    <span>Profile</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="start" 
                alignOffset={-5}
                className="w-56 bg-white border rounded-md shadow-lg z-[9999]"
              >
                {profileSubItems.map((subItem, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <Link
                      to={subItem.path}
                      className={`flex items-center ${
                        subItem.active ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
      
      {/* User Profile */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 cursor-pointer">
              <UserAvatar userProfile={profile} squared={true} canUpload={true} />
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'Patient'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email || 'patient@example.com'}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="right"
            sideOffset={5}
            className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = "/upgrade"}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = "/profile"}>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/billing"}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/notifications"}>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default UnifiedSidebar;

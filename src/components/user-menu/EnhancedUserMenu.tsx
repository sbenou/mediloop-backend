
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Home, 
  User, 
  ShoppingBag,
  Settings, 
  Pill, 
  Calendar,
  LogOut,
  Users,
  Store,
  FileText
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const EnhancedUserMenu = () => {
  const { profile, user, userRole } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return null;
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system"
      });
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was a problem logging you out"
      });
    }
  };

  // Function to navigate to different dashboard views
  const navigateToView = (view: string, section?: string, tab?: string) => {
    const params = new URLSearchParams();
    
    if (view) params.set('view', view);
    if (section) params.set('section', section);
    if (tab) params.set(`${view}Tab`, tab);
    
    navigate(`/dashboard?${params.toString()}`);
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    // Common items for all roles
    const commonItems = [
      {
        icon: <Home className="mr-2 h-4 w-4" />,
        label: "Dashboard",
        onClick: () => navigate('/dashboard')
      }
    ];

    // Role-specific navigation items
    if (userRole === 'pharmacist') {
      return [
        ...commonItems,
        {
          icon: <Users className="mr-2 h-4 w-4" />,
          label: "Patients",
          onClick: () => navigateToView('pharmacy', 'patients')
        },
        {
          icon: <ShoppingBag className="mr-2 h-4 w-4" />,
          label: "Orders",
          onClick: () => navigateToView('pharmacy', 'orders')
        },
        {
          icon: <FileText className="mr-2 h-4 w-4" />,
          label: "Prescriptions",
          onClick: () => navigateToView('pharmacy', 'prescriptions')
        },
        {
          icon: <User className="mr-2 h-4 w-4" />,
          label: "Profile",
          onClick: () => navigateToView('pharmacy', 'profile')
        },
        {
          icon: <Store className="mr-2 h-4 w-4" />,
          label: "Pharmacy Profile",
          onClick: () => navigate('/pharmacy/profile')
        },
        {
          icon: <Settings className="mr-2 h-4 w-4" />,
          label: "Settings",
          onClick: () => navigateToView('pharmacy', 'settings')
        }
      ];
    } else if (userRole === 'doctor') {
      return [
        ...commonItems,
        {
          icon: <Users className="mr-2 h-4 w-4" />,
          label: "Patients",
          onClick: () => navigateToView('doctor', 'patients')
        },
        {
          icon: <FileText className="mr-2 h-4 w-4" />,
          label: "Prescriptions",
          onClick: () => navigateToView('doctor', 'prescriptions')
        },
        {
          icon: <Calendar className="mr-2 h-4 w-4" />,
          label: "Teleconsultations",
          onClick: () => navigateToView('doctor', 'teleconsultations')
        },
        {
          icon: <User className="mr-2 h-4 w-4" />,
          label: "Profile",
          onClick: () => navigateToView('doctor', 'profile')
        },
        {
          icon: <Settings className="mr-2 h-4 w-4" />,
          label: "Settings",
          onClick: () => navigateToView('doctor', 'settings')
        }
      ];
    } else {
      // Default user items
      return [
        ...commonItems,
        {
          icon: <User className="mr-2 h-4 w-4" />,
          label: "Profile",
          onClick: () => navigateToView('profile', null, 'personal')
        },
        {
          icon: <ShoppingBag className="mr-2 h-4 w-4" />,
          label: "Orders",
          onClick: () => navigateToView('orders', null, 'orders')
        },
        {
          icon: <Pill className="mr-2 h-4 w-4" />,
          label: "Prescriptions",
          onClick: () => navigateToView('prescriptions')
        },
        {
          icon: <Calendar className="mr-2 h-4 w-4" />,
          label: "Teleconsultations",
          onClick: () => navigateToView('teleconsultations')
        },
        {
          icon: <Settings className="mr-2 h-4 w-4" />,
          label: "Settings",
          onClick: () => navigateToView('settings')
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center space-x-2">
          <UserAvatar userProfile={profile} />
          <span>{profile.full_name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {navigationItems.map((item, index) => (
            <DropdownMenuItem key={index} onClick={item.onClick}>
              {item.icon}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedUserMenu;

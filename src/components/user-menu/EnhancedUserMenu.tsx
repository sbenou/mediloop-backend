
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, CreditCard, Bell, LayoutDashboard, FileText, Users, Store, Home } from "lucide-react";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { supabase, clearAllAuthStorage } from "@/lib/supabase";

interface MenuOption {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface EnhancedUserMenuProps {
  variant?: "header" | "sidebar";
}

const EnhancedUserMenu = ({ variant = "header" }: EnhancedUserMenuProps) => {
  const { user, profile, isAuthenticated, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userAvatar = useRecoilValue(userAvatarState);
  const [open, setOpen] = useState(false);
  
  if (!isAuthenticated || !profile) {
    return (
      <Button variant="outline" onClick={() => navigate('/login')}>
        Login
      </Button>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      console.log("Logout initiated");
      
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

  // Get navigation menu items based on user role
  const getHeaderMenuItems = (): MenuOption[] => {
    // Default items for all users
    const items: MenuOption[] = [
      { label: "Home", icon: <Home className="mr-2 h-4 w-4" />, path: "/dashboard" },
    ];
    
    if (profile.role === 'pharmacist' || isPharmacist) {
      return [
        { label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" />, path: "/pharmacy" },
        { label: "Patients", icon: <Users className="mr-2 h-4 w-4" />, path: "/dashboard?view=pharmacy&section=patients" },
        { label: "Orders", icon: <CreditCard className="mr-2 h-4 w-4" />, path: "/dashboard?view=pharmacy&section=orders" },
        { label: "Prescriptions", icon: <FileText className="mr-2 h-4 w-4" />, path: "/dashboard?view=pharmacy&section=prescriptions" },
        { label: "Profile", icon: <User className="mr-2 h-4 w-4" />, path: "/dashboard?view=pharmacy&section=profile" },
        { label: "Pharmacy Profile", icon: <Store className="mr-2 h-4 w-4" />, path: "/pharmacy/profile" },
        { label: "Settings", icon: <Settings className="mr-2 h-4 w-4" />, path: "/dashboard?view=pharmacy&section=settings" },
      ];
    } else if (profile.role === 'doctor') {
      return [
        { label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" />, path: "/doctor" },
        { label: "Patients", icon: <Users className="mr-2 h-4 w-4" />, path: "/dashboard?view=doctor&section=patients" },
        { label: "Prescriptions", icon: <FileText className="mr-2 h-4 w-4" />, path: "/dashboard?view=doctor&section=prescriptions" },
        { label: "Teleconsultations", icon: <Bell className="mr-2 h-4 w-4" />, path: "/dashboard?view=doctor&section=teleconsultations" },
        { label: "Profile", icon: <User className="mr-2 h-4 w-4" />, path: "/dashboard?view=doctor&section=profile" },
        { label: "Settings", icon: <Settings className="mr-2 h-4 w-4" />, path: "/dashboard?view=doctor&section=settings" },
      ];
    } else {
      // For patients or other roles
      return [
        { label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" />, path: "/dashboard?view=home" },
        { label: "Orders", icon: <CreditCard className="mr-2 h-4 w-4" />, path: "/dashboard?view=orders" },
        { label: "Prescriptions", icon: <FileText className="mr-2 h-4 w-4" />, path: "/dashboard?view=prescriptions" },
        { label: "Teleconsultations", icon: <Bell className="mr-2 h-4 w-4" />, path: "/dashboard?view=teleconsultations" },
        { label: "Profile", icon: <User className="mr-2 h-4 w-4" />, path: "/dashboard?view=profile" },
        { label: "Settings", icon: <Settings className="mr-2 h-4 w-4" />, path: "/dashboard?view=settings" },
      ];
    }
  };

  // Get menu items based on variant (header or sidebar)
  const menuItems = variant === "header" ? getHeaderMenuItems() : [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={userAvatar || profile?.avatar_url || ""} 
              alt={profile?.full_name || "User avatar"} 
            />
            <AvatarFallback>{getInitials(profile?.full_name || "User")}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {variant === "header" && (
          <>
            {menuItems.map((item, index) => (
              <DropdownMenuItem 
                key={`menu-item-${index}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        
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

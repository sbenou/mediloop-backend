
import React, { RefObject, MouseEvent } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  CreditCard, 
  LogOut, 
  Settings, 
  User, 
  Building, 
  Home 
} from "lucide-react";

interface SidebarUserMenuProps {
  profile: any;
  userRole: string;
  fileInputRef: RefObject<HTMLInputElement>;
  handleAvatarClick: () => void;
  getUserInitials: (name?: string) => string;
  handleLogout: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  navigateToAccount?: () => void;
  navigateToBilling?: () => void;
  navigateToUpgrade?: () => void;
  navigateToPharmacyProfile?: () => void;
  navigateToDoctorProfile?: () => void;
  navigateToProfile?: () => void;
  navigateToPharmacyDashboard?: () => void;
}

const SidebarUserMenu = ({
  profile,
  userRole,
  fileInputRef,
  handleAvatarClick,
  getUserInitials,
  handleLogout,
  handleFileChange,
  navigateToAccount,
  navigateToBilling,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  navigateToDoctorProfile,
  navigateToProfile,
  navigateToPharmacyDashboard
}: SidebarUserMenuProps) => {
  return (
    <div className="mt-auto p-4 border-t">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={handleAvatarClick}
            className="flex items-center w-full p-2 rounded-md hover:bg-muted transition-colors"
          >
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || "User"} />
              <AvatarFallback>
                {getUserInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium line-clamp-1">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-56">
          {navigateToAccount && (
            <DropdownMenuItem onClick={navigateToAccount}>
              <User className="mr-2 h-4 w-4" />
              <span>My Account</span>
            </DropdownMenuItem>
          )}
          
          {navigateToProfile && (
            <DropdownMenuItem onClick={navigateToProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          )}
          
          {navigateToPharmacyProfile && (
            <DropdownMenuItem onClick={navigateToPharmacyProfile}>
              <Building className="mr-2 h-4 w-4" />
              <span>Pharmacy Profile</span>
            </DropdownMenuItem>
          )}
          
          {navigateToPharmacyDashboard && (
            <DropdownMenuItem onClick={navigateToPharmacyDashboard}>
              <Home className="mr-2 h-4 w-4" />
              <span>Pharmacy Dashboard</span>
            </DropdownMenuItem>
          )}
          
          {navigateToDoctorProfile && (
            <DropdownMenuItem onClick={navigateToDoctorProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Doctor Profile</span>
            </DropdownMenuItem>
          )}
          
          {navigateToBilling && (
            <DropdownMenuItem onClick={navigateToBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          )}
          
          {navigateToUpgrade && (
            <DropdownMenuItem onClick={navigateToUpgrade}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Upgrade</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserMenu;

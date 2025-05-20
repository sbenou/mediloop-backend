
import React, { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Settings, LogOut, CreditCard, Rocket, Home } from "lucide-react";
import { UserProfile } from "@/types/user";

interface SidebarUserMenuProps {
  profile?: UserProfile | null;
  userRole?: string | null;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  getUserInitials?: (profile?: UserProfile | null) => string;
  handleAvatarClick?: () => void;
  handleLogout?: () => void;
  handleFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  navigateToProfile?: () => void;
  navigateToAccount?: () => void;
  navigateToBilling?: () => void;
  navigateToUpgrade?: () => void;
  navigateToPharmacyProfile?: () => void;
  navigateToDoctorProfile?: () => void;
  navigateToPharmacyDashboard?: () => void;
}

const SidebarUserMenu: React.FC<SidebarUserMenuProps> = ({
  profile,
  userRole,
  fileInputRef,
  getUserInitials = () => "?",
  handleAvatarClick,
  handleLogout,
  handleFileChange,
  navigateToProfile,
  navigateToAccount,
  navigateToBilling,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  navigateToDoctorProfile,
  navigateToPharmacyDashboard
}) => {
  const initials = getUserInitials(profile);

  return (
    <div className="mt-auto border-t p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-between w-full rounded-md px-2 py-2 hover:bg-accent">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={handleAvatarClick ? (e) => {
                e.stopPropagation();
                handleAvatarClick();
              } : undefined}>
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 text-left">
                <p className="text-sm font-medium">{profile?.full_name || profile?.email || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole || "Guest"}</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Go to User Profile */}
          {navigateToProfile && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          )}
          
          {/* Go to Account Settings */}
          {navigateToAccount && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToAccount}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
          )}
          
          {/* Go to Billing Details */}
          {navigateToBilling && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          )}
          
          {/* Go to Upgrade Page */}
          {navigateToUpgrade && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToUpgrade}>
              <Rocket className="mr-2 h-4 w-4" />
              <span>Upgrade Plan</span>
            </DropdownMenuItem>
          )}
          
          {/* Go to Pharmacy Profile (Pharmacist Only) */}
          {navigateToPharmacyProfile && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToPharmacyProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Pharmacy Profile</span>
            </DropdownMenuItem>
          )}
          
          {/* Go to Doctor Profile (Doctor Only) */}
          {navigateToDoctorProfile && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToDoctorProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Doctor Profile</span>
            </DropdownMenuItem>
          )}
          
          {/* Go to Pharmacy Dashboard (Pharmacist Only) */}
          {navigateToPharmacyDashboard && (
            <DropdownMenuItem className="cursor-pointer" onClick={navigateToPharmacyDashboard}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Logout Button */}
          {handleLogout && (
            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {fileInputRef && handleFileChange && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default SidebarUserMenu;

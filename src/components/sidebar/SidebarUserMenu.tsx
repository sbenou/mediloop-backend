
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, CreditCard, Medal, Building } from "lucide-react";
import { Profile } from "@/types/supabase";

interface SidebarUserMenuProps {
  profile?: Profile | null;
  userRole?: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarClick: () => void;
  getUserInitials: () => string;
  handleLogout: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  navigateToAccount?: () => void;
  navigateToDoctorProfile?: () => void;
  navigateToPharmacyProfile?: () => void;
  navigateToPharmacyDashboard?: () => void;
  navigateToBilling?: () => void;
  navigateToUpgrade?: () => void;
}

const SidebarUserMenu: React.FC<SidebarUserMenuProps> = ({
  profile,
  userRole,
  fileInputRef,
  handleAvatarClick,
  getUserInitials,
  handleLogout,
  handleFileChange,
  navigateToAccount,
  navigateToDoctorProfile,
  navigateToPharmacyProfile,
  navigateToPharmacyDashboard,
  navigateToBilling,
  navigateToUpgrade
}) => {
  const roleName = userRole === 'patient' || userRole === 'user' ? 'Patient' : userRole;
  
  return (
    <div className="py-4 px-3 border-t">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center w-full rounded-lg p-2 hover:bg-gray-100 transition-colors">
            <Avatar className="h-8 w-8 cursor-pointer" onClick={handleAvatarClick}>
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 text-left">
              <p className="text-sm font-medium truncate max-w-[170px]">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">{roleName}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile?.email || ''}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {navigateToAccount && (
            <DropdownMenuItem onClick={navigateToAccount}>
              <User className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
          )}
          
          {navigateToDoctorProfile && userRole === 'doctor' && (
            <DropdownMenuItem onClick={navigateToDoctorProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Doctor Profile</span>
            </DropdownMenuItem>
          )}
          
          {navigateToPharmacyDashboard && userRole === 'pharmacist' && (
            <DropdownMenuItem onClick={navigateToPharmacyDashboard}>
              <Building className="mr-2 h-4 w-4" />
              <span>Pharmacy Dashboard</span>
            </DropdownMenuItem>
          )}
          
          {navigateToPharmacyProfile && userRole === 'pharmacist' && (
            <DropdownMenuItem onClick={navigateToPharmacyProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Pharmacy Profile</span>
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
              <Medal className="mr-2 h-4 w-4" />
              <span>Upgrade</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserMenu;

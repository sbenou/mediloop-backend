
import { UserProfile } from "@/types/user";
import { ChevronDown, CreditCard, LogOut, User, Store } from "lucide-react";
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
import { RefObject, useEffect, useState } from "react";

interface SidebarUserMenuProps {
  profile: UserProfile | null;
  userRole: string;
  fileInputRef: RefObject<HTMLInputElement>;
  handleAvatarClick: (e: React.MouseEvent) => void;
  getUserInitials: () => string;
  handleLogout: () => Promise<void>;
  navigateToProfile: () => void;
  navigateToBilling: () => void;
  navigateToUpgrade: () => void;
  navigateToPharmacyProfile?: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const SidebarUserMenu = ({
  profile,
  userRole,
  fileInputRef,
  handleAvatarClick,
  getUserInitials,
  handleLogout,
  navigateToProfile,
  navigateToBilling,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  handleFileChange
}: SidebarUserMenuProps) => {
  // State to track if the pharmacy link has been rendered
  const [hasRenderedPharmacyLink, setHasRenderedPharmacyLink] = useState(false);
  
  // Determine display name based on user role
  const displayName = userRole === 'pharmacist' 
    ? profile?.pharmacy_name || 'Pharmacy' 
    : profile?.full_name || 'User';
  
  // Determine email or secondary text
  const secondaryText = userRole === 'pharmacist'
    ? 'Pharmacy Account'
    : profile?.email || 'user@example.com';

  // Enhanced debug logs to verify userRole value and navigation function
  useEffect(() => {
    console.log("SidebarUserMenu: userRole =", userRole, "navigateToPharmacyProfile =", !!navigateToPharmacyProfile);
    console.log("SidebarUserMenu: Is pharmacist check =", userRole === 'pharmacist');
    console.log("SidebarUserMenu: Navigation function type =", typeof navigateToPharmacyProfile);

    const shouldShowPharmacyLink = userRole === 'pharmacist' && typeof navigateToPharmacyProfile === 'function';
    
    console.log("SidebarUserMenu mounted with:", {
      userRole,
      hasPharmacyProfileFn: !!navigateToPharmacyProfile,
      shouldShowPharmacyLink
    });

    // Force create and click the pharmacy link if it's not showing up
    if (userRole === 'pharmacist' && !!navigateToPharmacyProfile && !hasRenderedPharmacyLink) {
      setTimeout(() => {
        const pharmacyLinks = document.querySelectorAll('.pharmacy-profile-link');
        console.log("Pharmacy profile links found in DOM:", pharmacyLinks.length);
        setHasRenderedPharmacyLink(pharmacyLinks.length > 0);
        
        // If no link found, try to force render it
        if (pharmacyLinks.length === 0 && typeof navigateToPharmacyProfile === 'function') {
          console.log("Forcing pharmacy link visibility");
          // We'll rely on the conditional rendering in the JSX instead
        }
      }, 1000);
    }
  }, [userRole, navigateToPharmacyProfile, hasRenderedPharmacyLink]);

  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-3">
        {/* Avatar container - completely separated from the dropdown */}
        <div 
          onClick={handleAvatarClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <UserAvatar 
            userProfile={profile} 
            canUpload={true}
            onAvatarClick={(e) => {
              e.stopPropagation();
              handleAvatarClick(e);
            }}
            fallbackText={getUserInitials()} 
            isSquare={userRole === 'pharmacist'}
            isPharmacyAvatar={userRole === 'pharmacist'} // Specify pharmacy avatar
          />
        </div>
        
        {/* Text info container with dropdown trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="overflow-hidden flex-1 flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{secondaryText}</p>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
            </div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" side="right" className="w-56 bg-white">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 items-center">
                <p className="text-sm font-normal">{profile?.email || 'user@example.com'}</p>
                <p className="text-xs font-medium">{userRole === 'user' ? 'Patient' : userRole}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={navigateToUpgrade}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* Move the Pharmacy Profile link before Account for better visibility */}
              {userRole === 'pharmacist' && typeof navigateToPharmacyProfile === 'function' && (
                <DropdownMenuItem 
                  onClick={() => {
                    console.log("Pharmacy Profile link clicked");
                    if (navigateToPharmacyProfile) {
                      navigateToPharmacyProfile();
                    } else {
                      console.error("navigateToPharmacyProfile is not defined");
                    }
                  }}
                  className="pharmacy-profile-link bg-blue-50"
                >
                  <Store className="mr-2 h-4 w-4" />
                  <span>Pharmacy Profile</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={navigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={navigateToBilling}>
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
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default SidebarUserMenu;

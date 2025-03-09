
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
  console.log("SidebarUserMenu: userRole =", userRole, "navigateToPharmacyProfile =", !!navigateToPharmacyProfile);
  console.log("SidebarUserMenu: Is pharmacist check =", userRole === 'pharmacist');
  console.log("SidebarUserMenu: Navigation function type =", typeof navigateToPharmacyProfile);

  // Debug log to check dropdown menu content on mount
  useEffect(() => {
    const shouldShowPharmacyLink = userRole === 'pharmacist' && !!navigateToPharmacyProfile;
    
    console.log("SidebarUserMenu mounted with:", {
      userRole,
      hasPharmacyProfileFn: !!navigateToPharmacyProfile,
      shouldShowPharmacyLink
    });

    // Debug function to inspect DOM after render
    const checkForPharmacyLink = () => {
      setTimeout(() => {
        const pharmacyLinks = document.querySelectorAll('.pharmacy-profile-link');
        console.log("Pharmacy profile links found in DOM:", pharmacyLinks.length);
        setHasRenderedPharmacyLink(pharmacyLinks.length > 0);
      }, 1000);
    };
    
    checkForPharmacyLink();
  }, [userRole, navigateToPharmacyProfile]);

  // Run console logs outside of JSX to avoid TypeScript errors
  useEffect(() => {
    if (userRole === 'pharmacist') {
      console.log("Pharmacy check passed in JSX");
    }
    if (!!navigateToPharmacyProfile) {
      console.log("navigateToPharmacyProfile is defined in JSX");
    }
  }, [userRole, navigateToPharmacyProfile]);

  // Force a check for pharmacy profile link after component has mounted
  useEffect(() => {
    if (userRole === 'pharmacist' && navigateToPharmacyProfile && !hasRenderedPharmacyLink) {
      console.log("Attempting to force pharmacy link visibility check");
      // Force a re-render or DOM check
      setTimeout(() => {
        console.log("Delayed pharmacy link check - navigateToPharmacyProfile exists:", !!navigateToPharmacyProfile);
        console.log("Function reference:", navigateToPharmacyProfile);
      }, 2000);
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
          
          <DropdownMenuContent align="end" side="right" className="w-56">
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
              {userRole === 'pharmacist' && navigateToPharmacyProfile && (
                <DropdownMenuItem 
                  onClick={() => {
                    console.log("Pharmacy Profile link clicked");
                    navigateToPharmacyProfile();
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

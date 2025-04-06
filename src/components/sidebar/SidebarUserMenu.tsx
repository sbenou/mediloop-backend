
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
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { doctorStampUrlState, pharmacyLogoUrlState } from "@/store/images/atoms";
import { supabase } from "@/lib/supabase";

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
  navigateToDoctorProfile?: () => void;
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
  navigateToDoctorProfile,
  handleFileChange
}: SidebarUserMenuProps) => {
  // Get relevant image URLs from Recoil state
  const userAvatar = useRecoilValue(userAvatarState);
  const doctorStampUrl = useRecoilValue(doctorStampUrlState);
  const pharmacyLogoUrl = useRecoilValue(pharmacyLogoUrlState);
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  
  // Fetch pharmacy name if user is a pharmacist
  useEffect(() => {
    const fetchPharmacyName = async () => {
      if (userRole === 'pharmacist' && profile?.id) {
        try {
          // First check if pharmacy name is already in the profile
          if (profile.pharmacy_name) {
            setPharmacyName(profile.pharmacy_name);
            return;
          }
          
          // If not, get the pharmacy_id from user_pharmacies
          const { data: pharmacyRelation, error: relationError } = await supabase
            .from('user_pharmacies')
            .select('pharmacy_id')
            .eq('user_id', profile.id)
            .single();

          if (relationError || !pharmacyRelation?.pharmacy_id) {
            console.error('Error fetching pharmacy relation:', relationError);
            return;
          }

          // Then get the pharmacy name
          const { data: pharmacy, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('name')
            .eq('id', pharmacyRelation.pharmacy_id)
            .single();

          if (pharmacyError || !pharmacy) {
            console.error('Error fetching pharmacy:', pharmacyError);
            return;
          }

          setPharmacyName(pharmacy.name);
          
          // Update the user profile with the pharmacy name for future use
          await supabase
            .from('profiles')
            .update({ pharmacy_name: pharmacy.name })
            .eq('id', profile.id);
        } catch (error) {
          console.error('Error fetching pharmacy name:', error);
        }
      }
    };

    fetchPharmacyName();
  }, [profile?.id, userRole, profile?.pharmacy_name]);
  
  // Log the pharmacy logo URL to help debug
  useEffect(() => {
    if (userRole === 'pharmacist') {
      console.log("SidebarUserMenu: Pharmacy logo URL =", pharmacyLogoUrl || profile?.pharmacy_logo_url);
    }
  }, [pharmacyLogoUrl, profile?.pharmacy_logo_url, userRole]);
  
  // Determine which avatar URL to use based on user role
  const getAvatarUrl = () => {
    // For pharmacists, prioritize Recoil state, then profile's pharmacy_logo_url
    if (userRole === 'pharmacist') {
      return pharmacyLogoUrl || profile?.pharmacy_logo_url || null;
    } 
    // For doctors, use doctor stamp
    else if (userRole === 'doctor') {
      return doctorStampUrl || null;
    } 
    // For other users, use regular avatar
    else {
      return userAvatar || profile?.avatar_url || null;
    }
  };
  
  // Determine display name based on user role - prioritize pharmacy_name for pharmacists
  const displayName = userRole === 'pharmacist' 
    ? pharmacyName || 'Pharmacy'
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
  }, [userRole, navigateToPharmacyProfile]);

  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-3">
        {/* Avatar container - completely separated from the dropdown */}
        <div 
          onClick={handleAvatarClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <UserAvatar 
            userProfile={profile ? {
              ...profile,
              avatar_url: getAvatarUrl() || undefined
            } : undefined} 
            canUpload={true}
            onAvatarClick={(e) => {
              e.stopPropagation();
              handleAvatarClick(e);
            }}
            fallbackText={getUserInitials()} 
            isSquare={true} // Make all avatars square in the sidebar
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
              
              {/* Doctor Profile link */}
              {userRole === 'doctor' && typeof navigateToDoctorProfile === 'function' && (
                <DropdownMenuItem 
                  onClick={() => {
                    console.log("Doctor Profile link clicked");
                    if (navigateToDoctorProfile) {
                      navigateToDoctorProfile();
                    } else {
                      console.error("navigateToDoctorProfile is not defined");
                    }
                  }}
                  className="doctor-profile-link bg-blue-50"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Doctor Profile</span>
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

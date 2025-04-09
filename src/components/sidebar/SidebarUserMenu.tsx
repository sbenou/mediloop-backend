
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
import { WeekHours } from "@/types/pharmacy/hours";

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
  const [isAvailable, setIsAvailable] = useState(true);
  
  // Fetch pharmacy name if user is a pharmacist
  useEffect(() => {
    const fetchPharmacyData = async () => {
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
            .select('name, hours')
            .eq('id', pharmacyRelation.pharmacy_id)
            .single();

          if (pharmacyError || !pharmacy) {
            console.error('Error fetching pharmacy:', pharmacyError);
            return;
          }

          setPharmacyName(pharmacy.name);
          
          // Check pharmacy hours to determine availability
          if (pharmacy.hours) {
            checkPharmacyAvailability(pharmacy.hours);
          }
          
          // Update the user profile with the pharmacy name for future use
          await supabase
            .from('profiles')
            .update({ pharmacy_name: pharmacy.name })
            .eq('id', profile.id);
            
          // Also check and fetch pharmacy logo if it's not already set
          if (!profile.pharmacy_logo_url) {
            const { data: metadata } = await supabase
              .from('pharmacy_metadata')
              .select('logo_url')
              .eq('pharmacy_id', pharmacyRelation.pharmacy_id)
              .maybeSingle();
              
            if (metadata?.logo_url) {
              // Update user profile with the pharmacy logo
              await supabase
                .from('profiles')
                .update({ pharmacy_logo_url: metadata.logo_url })
                .eq('id', profile.id);
            } else {
              // Check pharmacy storage folder for images
              try {
                const { data: storageFiles, error: storageError } = await supabase.storage
                  .from('pharmacy-images')
                  .list(`pharmacies/${pharmacyRelation.pharmacy_id}`);
                  
                if (!storageError && storageFiles && storageFiles.length > 0) {
                  // Find first image file
                  const imageFile = storageFiles.find(file => 
                    file.name.endsWith('.jpg') || 
                    file.name.endsWith('.jpeg') || 
                    file.name.endsWith('.png') || 
                    file.name.endsWith('.gif')
                  );
                  
                  if (imageFile) {
                    const { data: { publicUrl } } = supabase.storage
                      .from('pharmacy-images')
                      .getPublicUrl(`pharmacies/${pharmacyRelation.pharmacy_id}/${imageFile.name}`);
                      
                    // Update user profile with the logo
                    await supabase
                      .from('profiles')
                      .update({ pharmacy_logo_url: publicUrl })
                      .eq('id', profile.id);
                      
                    // Also update metadata
                    await supabase
                      .from('pharmacy_metadata')
                      .upsert({ 
                        pharmacy_id: pharmacyRelation.pharmacy_id, 
                        logo_url: publicUrl 
                      });
                  }
                }
              } catch (storageError) {
                console.error('Error checking pharmacy storage:', storageError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching pharmacy data:', error);
        }
      } else if (userRole === 'doctor' && profile?.id) {
        // For doctors, check their availability
        checkDoctorAvailability(profile.id);
      }
    };

    fetchPharmacyData();
  }, [profile?.id, userRole, profile?.pharmacy_name]);
  
  // Function to check if current time is within pharmacy opening hours
  const checkPharmacyAvailability = (hoursString: string) => {
    try {
      // Try to parse the hours string as JSON
      let hours: Partial<WeekHours>;
      try {
        hours = JSON.parse(hoursString);
      } catch (e) {
        console.error("Error parsing pharmacy hours:", e);
        setIsAvailable(false);
        return;
      }
      
      // Get current day and time
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check if current day exists in hours object
      if (hours && hours[currentDay as keyof WeekHours]) {
        const dayHours = hours[currentDay as keyof WeekHours];
        
        // If the pharmacy is closed today or no hours specified
        if (!dayHours || (dayHours as any).open === false) {
          setIsAvailable(false);
          return;
        }
        
        // Check if current time is within open hours
        const openTime = (dayHours as any).openTime;
        const closeTime = (dayHours as any).closeTime;
        
        if (openTime && closeTime) {
          setIsAvailable(currentTime >= openTime && currentTime <= closeTime);
        } else {
          setIsAvailable(false);
        }
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      console.error("Error checking pharmacy availability:", error);
      setIsAvailable(false);
    }
  };
  
  // Function to check doctor's availability
  const checkDoctorAvailability = async (doctorId: string) => {
    try {
      // Get current day (0 = Sunday, 1 = Monday, etc.)
      const now = new Date();
      const currentDay = now.getDay();
      // Convert to 1-7 where 1 is Monday and 7 is Sunday to match our database format
      const dayOfWeek = currentDay === 0 ? 7 : currentDay;
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check doctor_availability
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('is_available, start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching doctor availability:', error);
        setIsAvailable(false);
        return;
      }
      
      // If we found availability data for today
      if (data) {
        // If the doctor explicitly set they're not available today
        if (!data.is_available) {
          setIsAvailable(false);
          return;
        }
        
        // Check if current time is within available hours
        if (data.start_time && data.end_time) {
          setIsAvailable(currentTime >= data.start_time && currentTime <= data.end_time);
        } else {
          // Default to available if times aren't specified but is_available is true
          setIsAvailable(true);
        }
      } else {
        // No availability record for today, default to not available
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      setIsAvailable(false);
    }
  };
  
  // Log the pharmacy logo URL to help debug
  useEffect(() => {
    if (userRole === 'pharmacist') {
      console.log("SidebarUserMenu: Pharmacy logo URL =", pharmacyLogoUrl || profile?.pharmacy_logo_url);
      console.log("SidebarUserMenu: Pharmacy name =", pharmacyName || profile?.pharmacy_name);
    }
  }, [pharmacyLogoUrl, profile?.pharmacy_logo_url, pharmacyName, profile?.pharmacy_name, userRole]);
  
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
    ? pharmacyName || profile?.pharmacy_name || 'Pharmacy'
    : profile?.full_name || 'User';
  
  // Determine email or secondary text
  const secondaryText = userRole === 'pharmacist'
    ? 'Pharmacy Account'
    : profile?.email || 'user@example.com';

  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-3">
        {/* Avatar container - completely separated from the dropdown */}
        <div 
          onClick={handleAvatarClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          data-testid="sidebar-avatar-container"
        >
          <UserAvatar 
            userProfile={profile ? {
              ...profile,
              pharmacy_name: pharmacyName || profile.pharmacy_name,
              pharmacy_logo_url: getAvatarUrl() || undefined
            } : undefined} 
            canUpload={true}
            onAvatarClick={(e) => {
              e.stopPropagation();
              handleAvatarClick(e);
            }}
            fallbackText={getUserInitials()} 
            isSquare={true} // Make all avatars square in the sidebar
            isAvailable={isAvailable} // Use our availability check
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


import { UserProfile } from "@/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { CreditCard, LogOut, Store, User } from "lucide-react";

interface SidebarMenuDropdownProps {
  triggerElement: React.ReactNode;
  profile: UserProfile | null;
  userRole: string;
  navigateToBilling: () => void;
  navigateToProfile: () => void;
  navigateToUpgrade: () => void;
  navigateToPharmacyProfile?: () => void;
  navigateToDoctorProfile?: () => void;
  handleLogout: () => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SidebarMenuDropdown = ({
  triggerElement,
  profile,
  userRole,
  navigateToBilling,
  navigateToProfile,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  navigateToDoctorProfile,
  handleLogout,
  isOpen,
  onOpenChange,
}: SidebarMenuDropdownProps) => {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {triggerElement}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" side="right" className="w-56 bg-white z-[9999]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 items-center">
            <p className="text-sm font-normal">{profile?.email || 'user@example.com'}</p>
            <p className="text-xs font-medium">{userRole === 'user' ? 'Patient' : userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => {
            navigateToUpgrade();
            onOpenChange?.(false);
          }}>
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
                  onOpenChange?.(false);
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
                  onOpenChange?.(false);
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
          
          <DropdownMenuItem onClick={() => {
            navigateToProfile();
            onOpenChange?.(false);
          }}>
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            navigateToBilling();
            onOpenChange?.(false);
          }}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
          handleLogout();
          onOpenChange?.(false);
        }}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SidebarMenuDropdown;

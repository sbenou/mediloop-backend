
import { UserProfile } from "@/types/user";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CreditCard, LogOut, Store, User } from "lucide-react";

interface UserMenuContentProps {
  userRole: string;
  profile: UserProfile | null;
  navigateToAccount: (() => void) | undefined;
  navigateToBilling: () => void;
  navigateToUpgrade: () => void;
  navigateToPharmacyProfile?: () => void;
  navigateToDoctorProfile?: () => void;
  handleLogout: () => Promise<void>;
}

export const UserMenuContent = ({
  userRole,
  profile,
  navigateToAccount,
  navigateToBilling,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  navigateToDoctorProfile,
  handleLogout,
}: UserMenuContentProps) => {
  return (
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
          <span>Upgrade</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {userRole === 'pharmacist' && typeof navigateToPharmacyProfile === 'function' && (
          <DropdownMenuItem 
            onClick={navigateToPharmacyProfile}
            className="pharmacy-profile-link bg-blue-50"
          >
            <Store className="mr-2 h-4 w-4" />
            <span>Pharmacy Profile</span>
          </DropdownMenuItem>
        )}
        
        {userRole === 'doctor' && typeof navigateToDoctorProfile === 'function' && (
          <DropdownMenuItem 
            onClick={navigateToDoctorProfile}
            className="doctor-profile-link bg-blue-50"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Doctor Profile</span>
          </DropdownMenuItem>
        )}
        
        {navigateToAccount && (
          <DropdownMenuItem onClick={navigateToAccount}>
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </DropdownMenuItem>
        )}
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
  );
};

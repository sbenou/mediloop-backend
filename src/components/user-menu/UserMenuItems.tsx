
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useRecoilValue } from "recoil";
import { userRoleSelector } from "@/store/auth/selectors";
import { LogOut, User, Settings, Building2, Truck, ClipboardList, Pill, ShoppingBag } from "lucide-react";

export function UserMenuItems() {
  const navigate = useNavigate();
  const userRole = useRecoilValue(userRoleSelector);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onClick={() => navigate("/profile")}>
        <User className="mr-2 h-4 w-4" />
        <span>Personal Details</span>
      </DropdownMenuItem>

      {/* Orders section - available for all authenticated users */}
      <DropdownMenuItem onClick={() => navigate("/my-orders")}>
        <ShoppingBag className="mr-2 h-4 w-4" />
        <span>My Orders</span>
      </DropdownMenuItem>

      {/* Prescriptions section - available for all authenticated users */}
      <DropdownMenuItem onClick={() => navigate("/my-prescriptions")}>
        <Pill className="mr-2 h-4 w-4" />
        <span>My Prescriptions</span>
      </DropdownMenuItem>
      
      {/* Partner/Transporter options - shown only for regular users */}
      {userRole === "user" && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/become-partner")}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Become a Partner</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/become-transporter")}>
            <Truck className="mr-2 h-4 w-4" />
            <span>Become a Transporter</span>
          </DropdownMenuItem>
        </>
      )}
      
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate("/settings")}>
        <Settings className="mr-2 h-4 w-4" />
        <span>My Settings</span>
      </DropdownMenuItem>
      
      {/* Admin settings - shown only for superadmin */}
      {userRole === "superadmin" && (
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Admin Settings</span>
        </DropdownMenuItem>
      )}
      
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

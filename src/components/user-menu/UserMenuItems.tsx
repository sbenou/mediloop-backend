
import { Fragment, useCallback } from "react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Bell, UserCircle, CreditCard, Store, Share } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { getMenuItemsByRole } from "./userMenuItemsByRole";
import { useUserMenuNavigation } from "./userMenuNavigation";
import { useUserMenuLogout } from "./useUserMenuLogout";

export function UserMenuItems() {
  const { profile, userRole, isPharmacist } = useAuth();
  const { handleNavigation } = useUserMenuNavigation();
  const { handleLogout } = useUserMenuLogout();
  
  // Always get menu items for the current role/status and ensure Doctor Profile is always included
  const menuItems = getMenuItemsByRole(userRole, isPharmacist);
  
  const renderMenuItem = useCallback((item, index) => {
    return (
      <Fragment key={`${item.label}-${index}`}>
        <DropdownMenuItem
          onClick={() => handleNavigation(item.path)}
          data-testid={`user-menu-item-${index}`}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.label}</span>
        </DropdownMenuItem>
      </Fragment>
    );
  }, [handleNavigation]);
  
  return (
    <>
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
        <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
      </div>
      <DropdownMenuSeparator />

      {menuItems.map(renderMenuItem)}

      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
}

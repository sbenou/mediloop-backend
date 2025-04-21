
import { Fragment, useCallback } from "react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Bell, UserCircle, CreditCard, Store, Share } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { getMenuItemsByRole } from "./userMenuItemsByRole";
import { useUserMenuNavigation } from "./userMenuNavigation";
import { useUserMenuLogout } from "./useUserMenuLogout";
import { useLocation } from "react-router-dom";

export function UserMenuItems() {
  const { profile, userRole, isPharmacist } = useAuth();
  const { handleNavigation } = useUserMenuNavigation();
  const { handleLogout } = useUserMenuLogout();
  const location = useLocation();
  
  // Always get menu items for the current role/status
  const menuItems = getMenuItemsByRole(userRole, isPharmacist);
  
  // Filter out the current page from menu items to avoid duplicate navigation
  const filteredMenuItems = menuItems.filter(item => {
    // Special case for Doctor Profile - never filter it out regardless of current page
    if (item.label === 'Doctor Profile') {
      return true;
    }
    
    // For other items, check if we're already on that page
    return !location.pathname.startsWith(item.path.split('?')[0]);
  });
  
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

      {filteredMenuItems.map(renderMenuItem)}

      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
}

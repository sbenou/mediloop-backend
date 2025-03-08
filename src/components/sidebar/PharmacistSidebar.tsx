
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  User, Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, LogOut,
  MapPin
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";

const PharmacistSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isPharmacistSectionActive,
    isPharmacistTabActive,
    navigateToLink
  } = useSidebarNavigation('pharmacist');
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick
  } = useSidebarUserProfile(profile);

  // Navigate specifically for pharmacy views
  const navigateToPharmacyView = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy view: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    const path = `/dashboard?view=pharmacy&section=${section}${tab && tabParam ? `&${tabParam}=${tab}` : ''}`;
    console.log('PharmacistSidebar navigating to:', path);
    navigateToLink(path);
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="Navigation">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5 mr-3" />}
            label="Dashboard"
            isActive={isPharmacistSectionActive('dashboard')}
            onClick={() => navigateToPharmacyView('dashboard')}
          />
          
          <SidebarItem
            icon={<Users className="w-5 h-5 mr-3" />}
            label="Patients"
            isActive={isPharmacistSectionActive('patients')}
            onClick={() => navigateToPharmacyView('patients')}
          />
          
          <SidebarCollapsibleItem 
            icon={<ShoppingBag className="w-5 h-5 mr-3" />}
            label="Orders"
            isOpen={isOrdersOpen}
            isActive={isPharmacistSectionActive('orders')}
            onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<ShoppingBag className="w-4 h-4 mr-3" />}
              label="All Orders"
              isActive={isPharmacistTabActive('orders', 'ordersTab', 'orders')}
              onClick={() => navigateToPharmacyView('orders', 'orders', 'ordersTab')}
            />
            <SidebarSubItem
              icon={<ShoppingBag className="w-4 h-4 mr-3" />}
              label="Pending"
              isActive={isPharmacistTabActive('orders', 'ordersTab', 'pending')}
              onClick={() => navigateToPharmacyView('orders', 'pending', 'ordersTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<FileText className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={isPharmacistSectionActive('prescriptions')}
            onClick={() => navigateToPharmacyView('prescriptions')}
          />
          
          <SidebarCollapsibleItem 
            icon={<User className="w-5 h-5 mr-3" />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={isPharmacistSectionActive('profile')}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<UserCircle className="w-4 h-4 mr-3" />}
              label="Personal Info"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'personal')}
              onClick={() => navigateToPharmacyView('profile', 'personal', 'profileTab')}
            />
            <SidebarSubItem
              icon={<MapPin className="w-4 h-4 mr-3" />}
              label="Addresses"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'addresses')}
              onClick={() => navigateToPharmacyView('profile', 'addresses', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="Next of Kin"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'nextofkin')}
              onClick={() => navigateToPharmacyView('profile', 'nextofkin', 'profileTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
            label="Settings"
            isActive={isPharmacistSectionActive('settings')}
            onClick={() => navigateToPharmacyView('settings')}
          />
        </SidebarSection>
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole="pharmacist"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={() => navigateToPharmacyView('profile', 'personal', 'profileTab')}
        navigateToBilling={() => navigateToPharmacyView('orders', 'payments', 'ordersTab')}
        navigateToUpgrade={() => navigate('/upgrade')}
      />
    </aside>
  );
};

export default PharmacistSidebar;

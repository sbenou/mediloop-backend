
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, 
  MapPin, Store, Pill, BellRing, CreditCard 
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";

interface PharmacistSidebarProps {
  canViewProducts?: boolean;
  canEditProducts?: boolean;
  canManageStaff?: boolean;
  canManagePrescriptions?: boolean;
  canViewPrescriptions?: boolean;
}

const PharmacistSidebar = ({
  canViewProducts = false,
  canEditProducts = false,
  canManageStaff = false,
  canManagePrescriptions = false,
  canViewPrescriptions = false
}: PharmacistSidebarProps) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isProfilePage = location.pathname.includes('/pharmacy/profile');
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);

  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    navigateToLink,
    isPharmacistSectionActive,
    isPharmacistTabActive
  } = useSidebarNavigation("pharmacist");

  // Navigate to pharmacy section within the dashboard route
  const navigateToPharmacySection = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy section: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    // When on profile page, always navigate to dashboard with appropriate params
    if (isProfilePage) {
      if (tab && tabParam) {
        navigate(`/dashboard?view=pharmacy&section=${section}&${tabParam}=${tab}`);
      } else {
        navigate(`/dashboard?view=pharmacy&section=${section}`);
      }
      return;
    }
    
    // Default behavior for regular dashboard view
    if (tab && tabParam) {
      const path = `?view=pharmacy&section=${section}&${tabParam}=${tab}`;
      navigateToLink(path);
    } else {
      const path = `?view=pharmacy&section=${section}`;
      navigateToLink(path);
    }
  };

  // Navigate to pharmacy profile page (separate page)
  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile from PharmacistSidebar');
    navigate('/pharmacy/profile');
  };

  // Navigate to products page
  const navigateToProducts = () => {
    console.log('Navigating to products page from PharmacistSidebar');
    navigate('/products');
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="Navigation">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5 mr-3" />}
            label="Dashboard"
            isActive={isPharmacistSectionActive("dashboard")}
            onClick={() => navigateToPharmacySection('dashboard')}
          />
          
          <SidebarCollapsibleItem 
            icon={<ShoppingBag className="w-5 h-5 mr-3" />}
            label="Orders"
            isOpen={isOrdersOpen}
            isActive={isPharmacistSectionActive("orders")}
            onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<ShoppingBag className="w-4 h-4 mr-3" />}
              label="Orders"
              isActive={isPharmacistTabActive("orders", "ordersTab", "all")}
              onClick={() => navigateToPharmacySection('orders', 'all', 'ordersTab')}
            />
            <SidebarSubItem
              icon={<CreditCard className="w-4 h-4 mr-3" />}
              label="Payments"
              isActive={isPharmacistTabActive("orders", "ordersTab", "payments")}
              onClick={() => navigateToPharmacySection('orders', 'payments', 'ordersTab')}
            />
          </SidebarCollapsibleItem>
          
          {canViewPrescriptions && (
            <SidebarItem
              icon={<FileText className="w-5 h-5 mr-3" />}
              label="Prescriptions"
              isActive={isPharmacistSectionActive("prescriptions")}
              onClick={() => navigateToPharmacySection('prescriptions')}
            />
          )}
          
          {canViewProducts && (
            <SidebarItem
              icon={<Pill className="w-5 h-5 mr-3" />}
              label="Products"
              isActive={location.pathname === '/products'}
              onClick={navigateToProducts}
            />
          )}
          
          <SidebarItem
            icon={<Users className="w-5 h-5 mr-3" />}
            label="Patients"
            isActive={isPharmacistSectionActive("patients")}
            onClick={() => navigateToPharmacySection('patients')}
          />
          
          <SidebarCollapsibleItem 
            icon={<UserCircle className="w-5 h-5 mr-3" />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={isPharmacistSectionActive("profile")}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<UserCircle className="w-4 h-4 mr-3" />}
              label="Personal Details"
              isActive={isPharmacistTabActive("profile", "profileTab", "personal")}
              onClick={() => navigateToPharmacySection('profile', 'personal', 'profileTab')}
            />
            <SidebarSubItem
              icon={<MapPin className="w-4 h-4 mr-3" />}
              label="Addresses"
              isActive={isPharmacistTabActive("profile", "profileTab", "addresses")}
              onClick={() => navigateToPharmacySection('profile', 'addresses', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="Next of Kin"
              isActive={isPharmacistTabActive("profile", "profileTab", "nextofkin")}
              onClick={() => navigateToPharmacySection('profile', 'nextofkin', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Store className="w-4 h-4 mr-3" />}
              label="Stamp & Signature"
              isActive={isPharmacistTabActive("profile", "profileTab", "stampSignature")}
              onClick={() => navigateToPharmacySection('profile', 'stampSignature', 'profileTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
            label="Settings"
            isActive={isPharmacistSectionActive("settings")}
            onClick={() => navigateToPharmacySection('settings')}
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
        navigateToProfile={() => navigateToPharmacySection('profile', 'personal', 'profileTab')}
        navigateToBilling={() => navigateToPharmacySection('orders', 'payments', 'ordersTab')}
        navigateToUpgrade={() => navigateToLink('/upgrade')}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default PharmacistSidebar;


import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, 
  MapPin, Store, Pill, CreditCard,
  Share
} from "lucide-react";
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";
import SidebarCollapsibleItem from "../SidebarCollapsibleItem";
import SidebarSubItem from "../SidebarSubItem";
import { useSidebarNavigation } from "../hooks/useSidebarNavigation";

interface PharmacistNavigationProps {
  canViewProducts?: boolean;
  canViewPrescriptions?: boolean;
  navigateToPharmacySection: (section: string, tab?: string, tabParam?: string) => void;
  navigateToProducts: () => void;
}

export const PharmacistNavigation = ({
  canViewProducts,
  canViewPrescriptions,
  navigateToPharmacySection,
  navigateToProducts
}: PharmacistNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isPharmacistSectionActive,
    isPharmacistTabActive
  } = useSidebarNavigation("pharmacist");

  return (
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
      
      <SidebarItem
        icon={<Share className="w-5 h-5 mr-3" />}
        label="Referral"
        isActive={location.pathname === "/referral"}
        onClick={() => navigate('/referral')}
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
  );
};


import React from "react";
import { useLocation } from "react-router-dom";
import { 
  ShoppingBag, Settings, 
  LayoutDashboard, FileText, 
  Users, User, Share
} from "lucide-react";
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";
import SidebarCollapsibleItem from "../SidebarCollapsibleItem";
import SidebarSubItem from "../SidebarSubItem";
import { usePharmacyNavigation } from "./usePharmacyNavigation";

interface PharmacistNavigationProps {
  canViewProducts?: boolean;
  canEditProducts?: boolean;
  canManagePrescriptions?: boolean;
  canViewPrescriptions?: boolean;
}

const PharmacistNavigation: React.FC<PharmacistNavigationProps> = ({
  canViewProducts = false,
  canEditProducts = false,
  canManagePrescriptions = false,
  canViewPrescriptions = true // Default to true to ensure prescriptions are visible
}) => {
  const location = useLocation();
  const { 
    navigateToPharmacySection,
    navigateToDashboard,
    navigateToReferral,
    navigateToPharmacyProfile,
    navigateToPharmacyPatientsPage,
    navigateToPrescriptions,
    isOrdersOpen, 
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isDashboardPage
  } = usePharmacyNavigation();

  return (
    <>
      <SidebarSection title="PLATFORM">
        <SidebarItem
          icon={<LayoutDashboard className="w-5 h-5 mr-3" />}
          label="Dashboard"
          isActive={isDashboardPage && !location.search.includes('section=')}
          onClick={navigateToDashboard}
        />
        
        <SidebarCollapsibleItem 
          icon={<ShoppingBag className="w-5 h-5 mr-3" />}
          label="Orders"
          isOpen={isOrdersOpen}
          isActive={location.search.includes('section=orders')}
          onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
        >
          <SidebarSubItem
            icon={<ShoppingBag className="w-4 h-4 mr-3" />}
            label="Orders"
            isActive={location.search.includes('section=orders') && location.search.includes('ordersTab=all')}
            onClick={() => navigateToPharmacySection('orders', 'all', 'ordersTab')}
          />
          <SidebarSubItem
            icon={<ShoppingBag className="w-4 h-4 mr-3" />}
            label="Payments"
            isActive={location.search.includes('section=orders') && location.search.includes('ordersTab=payments')}
            onClick={() => navigateToPharmacySection('orders', 'payments', 'ordersTab')}
          />
        </SidebarCollapsibleItem>
        
        <SidebarItem
          icon={<Users className="w-5 h-5 mr-3" />}
          label="Patients"
          isActive={location.pathname === '/pharmacy/patients'}
          onClick={navigateToPharmacyPatientsPage}
        />
        
        <SidebarItem
          icon={<FileText className="w-5 h-5 mr-3" />}
          label="Prescriptions"
          isActive={location.search.includes('section=prescriptions')}
          onClick={() => navigateToPrescriptions()}
        />

        <SidebarCollapsibleItem 
          icon={<User className="w-5 h-5 mr-3" />}
          label="Profile"
          isOpen={isProfileOpen}
          isActive={location.search.includes('section=profile') || location.pathname === '/pharmacy/profile'}
          onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
        >
          <SidebarSubItem
            icon={<User className="w-4 h-4 mr-3" />}
            label="Personal Details"
            isActive={location.search.includes('section=profile') && location.search.includes('profileTab=personal')}
            onClick={() => navigateToPharmacySection('profile', 'personal', 'profileTab')}
          />
          <SidebarSubItem
            icon={<User className="w-4 h-4 mr-3" />}
            label="Addresses"
            isActive={location.search.includes('section=profile') && location.search.includes('profileTab=addresses')}
            onClick={() => navigateToPharmacySection('profile', 'addresses', 'profileTab')}
          />
          <SidebarSubItem
            icon={<User className="w-4 h-4 mr-3" />}
            label="Next of Kin"
            isActive={location.search.includes('section=profile') && location.search.includes('profileTab=nextofkin')}
            onClick={() => navigateToPharmacySection('profile', 'nextofkin', 'profileTab')}
          />
          <SidebarSubItem
            icon={<User className="w-4 h-4 mr-3" />}
            label="Stamp & Signature"
            isActive={location.search.includes('section=profile') && location.search.includes('profileTab=stampSignature')}
            onClick={() => navigateToPharmacySection('profile', 'stampSignature', 'profileTab')}
          />
        </SidebarCollapsibleItem>

        <SidebarItem
          icon={<Share className="w-5 h-5 mr-3" />}
          label="Referral"
          isActive={location.pathname === '/referral'}
          onClick={navigateToReferral}
        />
      </SidebarSection>
      
      <SidebarSection title="ADMIN">
        <SidebarItem
          icon={<Settings className="w-5 h-5 mr-3" />}
          label="Settings"
          isActive={location.search.includes('section=settings')}
          onClick={() => navigateToPharmacySection('settings')}
        />
      </SidebarSection>
    </>
  );
};

export default PharmacistNavigation;


import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, 
  MapPin, Store, Pill, CreditCard,
  Share, BarChart
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
  canViewPrescriptions = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    navigateToPharmacySection,
    navigateToDashboard,
    navigateToProducts,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen, 
    setIsOrdersOpen,
    isDashboardPage
  } = usePharmacyNavigation();

  return (
    <SidebarSection title="Navigation">
      <SidebarItem
        icon={<LayoutDashboard className="w-5 h-5 mr-3" />}
        label="Dashboard"
        isActive={isDashboardPage && (location.search === '' || location.search.includes('section=dashboard'))}
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
          icon={<CreditCard className="w-4 h-4 mr-3" />}
          label="Payments"
          isActive={location.search.includes('section=orders') && location.search.includes('ordersTab=payments')}
          onClick={() => navigateToPharmacySection('orders', 'payments', 'ordersTab')}
        />
      </SidebarCollapsibleItem>
      
      {canViewPrescriptions && (
        <SidebarItem
          icon={<FileText className="w-5 h-5 mr-3" />}
          label="Prescriptions"
          isActive={location.search.includes('section=prescriptions')}
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
        isActive={location.search.includes('section=patients')}
        onClick={() => navigateToPharmacySection('patients')}
      />

      <SidebarItem
        icon={<BarChart className="w-5 h-5 mr-3" />}
        label="Analytics"
        isActive={location.search.includes('section=analytics')}
        onClick={() => navigateToPharmacySection('analytics')}
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
        isActive={location.search.includes('section=profile')}
        onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
      >
        <SidebarSubItem
          icon={<UserCircle className="w-4 h-4 mr-3" />}
          label="Personal Details"
          isActive={location.search.includes('section=profile') && location.search.includes('profileTab=personal')}
          onClick={() => navigateToPharmacySection('profile', 'personal', 'profileTab')}
        />
        <SidebarSubItem
          icon={<MapPin className="w-4 h-4 mr-3" />}
          label="Addresses"
          isActive={location.search.includes('section=profile') && location.search.includes('profileTab=addresses')}
          onClick={() => navigateToPharmacySection('profile', 'addresses', 'profileTab')}
        />
        <SidebarSubItem
          icon={<Users className="w-4 h-4 mr-3" />}
          label="Next of Kin"
          isActive={location.search.includes('section=profile') && location.search.includes('profileTab=nextofkin')}
          onClick={() => navigateToPharmacySection('profile', 'nextofkin', 'profileTab')}
        />
        <SidebarSubItem
          icon={<Store className="w-4 h-4 mr-3" />}
          label="Stamp & Signature"
          isActive={location.search.includes('section=profile') && location.search.includes('profileTab=stampSignature')}
          onClick={() => navigateToPharmacySection('profile', 'stampSignature', 'profileTab')}
        />
      </SidebarCollapsibleItem>
      
      <SidebarItem
        icon={<Settings className="w-5 h-5 mr-3" />}
        label="Settings"
        isActive={location.search.includes('section=settings')}
        onClick={() => navigateToPharmacySection('settings')}
      />
    </SidebarSection>
  );
};

export default PharmacistNavigation;


import React from "react";
import { useLocation } from "react-router-dom";
import { 
  ShoppingBag, Settings, 
  LayoutDashboard, FileText, 
  Users, BarChart,
  Share
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
  const { 
    navigateToPharmacySection,
    navigateToDashboard,
    navigateToReferral,
    navigateToSettings,
    isOrdersOpen, 
    setIsOrdersOpen,
    isDashboardPage
  } = usePharmacyNavigation();

  return (
    <>
      <SidebarSection title="PLATFORM">
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
            icon={<ShoppingBag className="w-4 h-4 mr-3" />}
            label="Payments"
            isActive={location.search.includes('section=orders') && location.search.includes('ordersTab=payments')}
            onClick={() => navigateToPharmacySection('orders', 'payments', 'ordersTab')}
          />
        </SidebarCollapsibleItem>
        
        <SidebarItem
          icon={<Users className="w-5 h-5 mr-3" />}
          label="Patients"
          isActive={location.search.includes('section=patients')}
          onClick={() => navigateToPharmacySection('patients')}
        />
        
        {canViewPrescriptions && (
          <SidebarItem
            icon={<FileText className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={location.search.includes('section=prescriptions')}
            onClick={() => navigateToPharmacySection('prescriptions')}
          />
        )}

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
          onClick={navigateToReferral}
        />
      </SidebarSection>
      
      <SidebarSection title="ADMIN">
        <SidebarItem
          icon={<Settings className="w-5 h-5 mr-3" />}
          label="Settings"
          isActive={location.search.includes('section=settings')}
          onClick={navigateToSettings}
        />
      </SidebarSection>
    </>
  );
};

export default PharmacistNavigation;

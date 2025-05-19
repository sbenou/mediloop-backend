
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingCart, FileText, Users, Settings } from "lucide-react";
import { useSidebarNavigation } from "../hooks/useSidebarNavigation";
import SidebarSection from "../SidebarSection";
import SidebarLink from "../SidebarLink";

interface PharmacistNavigationProps {
  canViewProducts?: boolean;
  canEditProducts?: boolean;
  canManagePrescriptions?: boolean;
  canViewPrescriptions?: boolean;
}

const PharmacistNavigation = ({
  canViewProducts = true,
  canEditProducts = false,
  canManagePrescriptions = false,
  canViewPrescriptions = true
}: PharmacistNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    navigateToLink,
    isLinkActive
  } = useSidebarNavigation("pharmacist");

  const handleDashboardClick = () => {
    console.log("PharmacistNavigation: Navigating to pharmacy dashboard");
    navigate("/pharmacy/dashboard", {
      state: { preserveAuth: true },
      replace: false
    });
  };

  return (
    <>
      <SidebarSection title="Platform">
        <SidebarLink
          icon={<Home className="h-4 w-4" />}
          label="Dashboard"
          onClick={handleDashboardClick}
          active={location.pathname === '/pharmacy/dashboard'}
        />

        {canViewProducts && (
          <SidebarLink
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Products"
            onClick={() => navigateToLink('/products')}
            active={isLinkActive('/products')}
          />
        )}
        
        {canViewPrescriptions && (
          <SidebarLink
            icon={<FileText className="h-4 w-4" />}
            label="Prescriptions"
            onClick={() => navigateToLink('/pharmacy/dashboard?section=prescriptions')}
            active={location.pathname.includes('/pharmacy/dashboard') && location.search.includes('section=prescriptions')}
          />
        )}
        
        <SidebarLink
          icon={<Users className="h-4 w-4" />}
          label="Patients"
          onClick={() => navigateToLink('/pharmacy/dashboard?section=patients')}
          active={location.pathname.includes('/pharmacy/dashboard') && location.search.includes('section=patients')}
        />
      </SidebarSection>
      
      <SidebarSection title="Settings">
        <SidebarLink
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          onClick={() => navigateToLink('/pharmacy/dashboard?section=settings')}
          active={location.pathname.includes('/pharmacy/dashboard') && location.search.includes('section=settings')}
        />
      </SidebarSection>
    </>
  );
};

export default PharmacistNavigation;

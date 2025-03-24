
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, 
  MapPin, Store
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";

const PharmacistSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  
  const [isOrdersOpen, setIsOrdersOpen] = React.useState(section === "orders");
  const [isProfileOpen, setIsProfileOpen] = React.useState(section === "profile");
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);

  // Update pharmacy view within the dashboard without page navigation
  const navigateToPharmacyView = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy view: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (tab && tabParam) {
      // Use replace to update URL without full page navigation
      navigate(`/dashboard?view=pharmacy&section=${section}&${tabParam}=${tab}`, { replace: true });
    } else {
      navigate(`/dashboard?view=pharmacy&section=${section}`, { replace: true });
    }
  };

  // Navigate to pharmacy profile page (separate page navigation)
  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile from PharmacistSidebar');
    navigate('/pharmacy/profile');
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="Navigation">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5 mr-3" />}
            label="Dashboard"
            isActive={section === "dashboard"}
            onClick={() => navigateToPharmacyView('dashboard')}
          />
          
          <SidebarItem
            icon={<Users className="w-5 h-5 mr-3" />}
            label="Patients"
            isActive={section === "patients"}
            onClick={() => navigateToPharmacyView('patients')}
          />
          
          <SidebarCollapsibleItem 
            icon={<ShoppingBag className="w-5 h-5 mr-3" />}
            label="Orders"
            isOpen={isOrdersOpen}
            isActive={section === "orders"}
            onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<ShoppingBag className="w-4 h-4 mr-3" />}
              label="All Orders"
              isActive={section === "orders" && (!searchParams.get("ordersTab") || searchParams.get("ordersTab") === "orders")}
              onClick={() => navigateToPharmacyView('orders', 'orders', 'ordersTab')}
            />
            <SidebarSubItem
              icon={<ShoppingBag className="w-4 h-4 mr-3" />}
              label="Pending"
              isActive={section === "orders" && searchParams.get("ordersTab") === "pending"}
              onClick={() => navigateToPharmacyView('orders', 'pending', 'ordersTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<FileText className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={section === "prescriptions"}
            onClick={() => navigateToPharmacyView('prescriptions')}
          />
          
          <SidebarCollapsibleItem 
            icon={<UserCircle className="w-5 h-5 mr-3" />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={section === "profile"}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<UserCircle className="w-4 h-4 mr-3" />}
              label="Personal Info"
              isActive={section === "profile" && (!searchParams.get("profileTab") || searchParams.get("profileTab") === "personal")}
              onClick={() => navigateToPharmacyView('profile', 'personal', 'profileTab')}
            />
            <SidebarSubItem
              icon={<MapPin className="w-4 h-4 mr-3" />}
              label="Addresses"
              isActive={section === "profile" && searchParams.get("profileTab") === "addresses"}
              onClick={() => navigateToPharmacyView('profile', 'addresses', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="Next of Kin"
              isActive={section === "profile" && searchParams.get("profileTab") === "nextofkin"}
              onClick={() => navigateToPharmacyView('profile', 'nextofkin', 'profileTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
            label="Settings"
            isActive={section === "settings"}
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
        navigateToPharmacyProfile={navigateToPharmacyProfile}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default PharmacistSidebar;

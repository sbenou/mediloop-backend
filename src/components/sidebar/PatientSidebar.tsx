
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, ShoppingBag, Settings, 
  FileText, UserCircle, MapPin, 
  Pill, Video, Heart, Users, CreditCard,
  Share
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";

const PatientSidebar = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get("view") || "home";
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    navigateToLink
  } = useSidebarNavigation("patient");
  
  // Stay on dashboard page but update view parameters for patient views
  const navigateToPatientView = (viewName: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to patient view: ${viewName}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (tab && tabParam) {
      const path = `/dashboard?view=${viewName}&${tabParam}=${tab}`;
      navigateToLink(path);
    } else {
      const path = `/dashboard?view=${viewName}`;
      navigateToLink(path);
    }
  };

  // Check if we are in orders view and if we have an orders tab parameter
  const ordersTab = searchParams.get("ordersTab");
  
  // Check if we are in profile view and if we have a profile tab parameter
  const profileTab = searchParams.get("profileTab");
  
  // Only make the parent Orders active if we're in the orders view without any specific tab
  // and the dropdown is not open
  const isOrdersActive = view === "orders" && !ordersTab && !isOrdersOpen;
  
  // Only make the parent Profile active if we're in the profile view without any specific tab
  // and the dropdown is not open
  const isProfileActive = view === "profile" && !profileTab && !isProfileOpen;

  // Use consistent icon sizes for the sidebar
  const iconSize = "w-5 h-5";
  const subIconSize = "w-4 h-4";

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="Platform">
          <SidebarItem
            icon={<Home className={`${iconSize} mr-4`} />}
            label="Dashboard"
            isActive={view === "home" || !view}
            onClick={() => navigateToPatientView("home")}
          />
          
          <SidebarCollapsibleItem 
            icon={<ShoppingBag className={`${iconSize} mr-4`} />}
            label="Orders"
            isOpen={isOrdersOpen}
            isActive={isOrdersActive}
            onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<ShoppingBag className={`${subIconSize} mr-4`} />}
              label="My Orders"
              isActive={view === "orders" && ordersTab === "orders"}
              onClick={() => navigateToPatientView("orders", "orders", "ordersTab")}
            />
            <SidebarSubItem
              icon={<CreditCard className={`${subIconSize} mr-4`} />}
              label="Payments"
              isActive={view === "orders" && ordersTab === "payments"}
              onClick={() => navigateToPatientView("orders", "payments", "ordersTab")}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Pill className={`${iconSize} mr-4`} />}
            label="Prescriptions"
            isActive={view === "prescriptions"}
            onClick={() => navigateToPatientView("prescriptions")}
          />
          
          <SidebarItem
            icon={<Video className={`${iconSize} mr-4`} />}
            label="Teleconsultations"
            isActive={view === "teleconsultations"}
            onClick={() => navigateToPatientView("teleconsultations")}
          />
          
          <SidebarItem
            icon={<Share className={`${iconSize} mr-4`} />}
            label="Referral"
            isActive={location.pathname === "/referral"}
            onClick={() => navigate('/referral')}
          />
          
          <SidebarCollapsibleItem 
            icon={<UserCircle className={`${iconSize} mr-4`} />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={isProfileActive}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<UserCircle className={`${subIconSize} mr-4`} />}
              label="Personal Info"
              isActive={view === "profile" && profileTab === "personal"}
              onClick={() => navigateToPatientView("profile", "personal", "profileTab")}
            />
            <SidebarSubItem
              icon={<MapPin className={`${subIconSize} mr-4`} />}
              label="Addresses"
              isActive={view === "profile" && profileTab === "addresses"}
              onClick={() => navigateToPatientView("profile", "addresses", "profileTab")}
            />
            <SidebarSubItem
              icon={<Heart className={`${subIconSize} mr-4`} />}
              label="Default Pharmacy"
              isActive={view === "profile" && profileTab === "pharmacy"}
              onClick={() => navigateToPatientView("profile", "pharmacy", "profileTab")}
            />
            <SidebarSubItem
              icon={<Users className={`${subIconSize} mr-4`} />}
              label="My Doctor"
              isActive={view === "profile" && profileTab === "doctor"}
              onClick={() => navigateToPatientView("profile", "doctor", "profileTab")}
            />
            <SidebarSubItem
              icon={<Users className={`${subIconSize} mr-4`} />}
              label="Next of Kin"
              isActive={view === "profile" && profileTab === "nextofkin"}
              onClick={() => navigateToPatientView("profile", "nextofkin", "profileTab")}
            />
          </SidebarCollapsibleItem>
        </SidebarSection>

        <div className="mt-8" />

        <SidebarSection title="Admin">
          <SidebarItem
            icon={<Settings className={`${iconSize} mr-4`} />}
            label="Settings"
            isActive={view === "settings"}
            onClick={() => navigateToPatientView("settings")}
          />
        </SidebarSection>
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole="patient"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={() => navigateToPatientView("profile", "personal", "profileTab")}
        navigateToBilling={() => navigate("/billing-details")}
        navigateToUpgrade={() => navigateToLink("/upgrade")}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default PatientSidebar;

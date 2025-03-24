
import React, { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, ShoppingBag, Settings, 
  FileText, UserCircle, MapPin, 
  Pill, Video, Heart, Users, CreditCard
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { useSidebarLogout } from "./hooks/useSidebarLogout";

const PatientSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get("view") || "home";
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  const [isOrdersOpen, setIsOrdersOpen] = useState(
    view === "orders" || false
  );
  
  const [isProfileOpen, setIsProfileOpen] = useState(
    view === "profile" || false
  );
  
  // Direct navigation with correct parameters for patient views
  const navigateToPatientView = (viewName: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to patient view: ${viewName}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (tab && tabParam) {
      navigate(`/dashboard?view=${viewName}&${tabParam}=${tab}`);
    } else {
      navigate(`/dashboard?view=${viewName}`);
    }
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="Navigation">
          <SidebarItem
            icon={<Home className="w-5 h-5 mr-3" />}
            label="Dashboard"
            isActive={view === "home" || !view}
            onClick={() => navigateToPatientView("home")}
          />
          
          <SidebarCollapsibleItem 
            icon={<ShoppingBag className="w-5 h-5 mr-3" />}
            label="Orders"
            isOpen={isOrdersOpen}
            isActive={view === "orders"}
            onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<ShoppingBag className="w-4 h-4 mr-3" />}
              label="My Orders"
              isActive={view === "orders" && (!searchParams.get("ordersTab") || searchParams.get("ordersTab") === "orders")}
              onClick={() => navigateToPatientView("orders", "orders", "ordersTab")}
            />
            <SidebarSubItem
              icon={<CreditCard className="w-4 h-4 mr-3" />}
              label="Payments"
              isActive={view === "orders" && searchParams.get("ordersTab") === "payments"}
              onClick={() => navigateToPatientView("orders", "payments", "ordersTab")}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Pill className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={view === "prescriptions"}
            onClick={() => navigateToPatientView("prescriptions")}
          />
          
          <SidebarItem
            icon={<Video className="w-5 h-5 mr-3" />}
            label="Teleconsultations"
            isActive={view === "teleconsultations"}
            onClick={() => navigateToPatientView("teleconsultations")}
          />
          
          <SidebarCollapsibleItem 
            icon={<UserCircle className="w-5 h-5 mr-3" />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={view === "profile"}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<UserCircle className="w-4 h-4 mr-3" />}
              label="Personal Info"
              isActive={view === "profile" && (!searchParams.get("profileTab") || searchParams.get("profileTab") === "personal")}
              onClick={() => navigateToPatientView("profile", "personal", "profileTab")}
            />
            <SidebarSubItem
              icon={<MapPin className="w-4 h-4 mr-3" />}
              label="Addresses"
              isActive={view === "profile" && searchParams.get("profileTab") === "addresses"}
              onClick={() => navigateToPatientView("profile", "addresses", "profileTab")}
            />
            <SidebarSubItem
              icon={<Heart className="w-4 h-4 mr-3" />}
              label="Default Pharmacy"
              isActive={view === "profile" && searchParams.get("profileTab") === "pharmacy"}
              onClick={() => navigateToPatientView("profile", "pharmacy", "profileTab")}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="My Doctor"
              isActive={view === "profile" && searchParams.get("profileTab") === "doctor"}
              onClick={() => navigateToPatientView("profile", "doctor", "profileTab")}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="Next of Kin"
              isActive={view === "profile" && searchParams.get("profileTab") === "nextofkin"}
              onClick={() => navigateToPatientView("profile", "nextofkin", "profileTab")}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
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
        navigateToBilling={() => navigateToPatientView("orders", "payments", "ordersTab")}
        navigateToUpgrade={() => navigate("/upgrade")}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default PatientSidebar;

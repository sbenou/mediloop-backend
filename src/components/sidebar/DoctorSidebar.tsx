
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, 
  MapPin, Video, Stethoscope 
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";

const DoctorSidebar = () => {
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

  // Navigate specifically for doctor views with improved logging
  const navigateToDoctorView = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to doctor view: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    if (tab && tabParam) {
      navigate(`/dashboard?view=doctor&section=${section}&${tabParam}=${tab}`);
    } else {
      navigate(`/dashboard?view=doctor&section=${section}`);
    }
  };

  // Navigate to doctor profile
  const navigateToDoctorProfile = () => {
    console.log('Navigating to doctor profile from DoctorSidebar');
    navigate('/doctor/profile');
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
            onClick={() => navigateToDoctorView('dashboard')}
          />
          
          <SidebarItem
            icon={<Users className="w-5 h-5 mr-3" />}
            label="Patients"
            isActive={section === "patients"}
            onClick={() => navigateToDoctorView('patients')}
          />
          
          <SidebarItem
            icon={<FileText className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={section === "prescriptions"}
            onClick={() => navigateToDoctorView('prescriptions')}
          />
          
          <SidebarItem
            icon={<Video className="w-5 h-5 mr-3" />}
            label="Teleconsultations"
            isActive={section === "teleconsultations"}
            onClick={() => navigateToDoctorView('teleconsultations')}
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
              onClick={() => navigateToDoctorView('profile', 'personal', 'profileTab')}
            />
            <SidebarSubItem
              icon={<MapPin className="w-4 h-4 mr-3" />}
              label="Addresses"
              isActive={section === "profile" && searchParams.get("profileTab") === "addresses"}
              onClick={() => navigateToDoctorView('profile', 'addresses', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="Next of Kin"
              isActive={section === "profile" && searchParams.get("profileTab") === "nextofkin"}
              onClick={() => navigateToDoctorView('profile', 'nextofkin', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Stethoscope className="w-4 h-4 mr-3" />}
              label="Stamp & Signature"
              isActive={section === "profile" && searchParams.get("profileTab") === "stamp"}
              onClick={() => navigateToDoctorView('profile', 'stamp', 'profileTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
            label="Settings"
            isActive={section === "settings"}
            onClick={() => navigateToDoctorView('settings')}
          />
        </SidebarSection>
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole="doctor"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={() => navigateToDoctorView('profile', 'personal', 'profileTab')}
        navigateToBilling={() => navigateToDoctorView('orders', 'payments', 'ordersTab')}
        navigateToUpgrade={() => navigate('/upgrade')}
        navigateToDoctorProfile={navigateToDoctorProfile}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default DoctorSidebar;

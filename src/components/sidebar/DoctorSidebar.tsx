
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Users, ShoppingBag, Settings, 
  LayoutDashboard, FileText, UserCircle, 
  MapPin, Video, Stethoscope, Stamp
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";

const DoctorSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isPharmacistSectionActive,
    isPharmacistTabActive,
    navigateToLink
  } = useSidebarNavigation('doctor');
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);

  // Navigate specifically for doctor views
  const navigateToDoctorView = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to doctor view: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    const path = `/dashboard?view=doctor&section=${section}${tab && tabParam ? `&${tabParam}=${tab}` : ''}`;
    console.log('DoctorSidebar navigating to:', path);
    navigateToLink(path);
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
            isActive={isPharmacistSectionActive('dashboard')}
            onClick={() => navigateToDoctorView('dashboard')}
          />
          
          <SidebarItem
            icon={<Users className="w-5 h-5 mr-3" />}
            label="Patients"
            isActive={isPharmacistSectionActive('patients')}
            onClick={() => navigateToDoctorView('patients')}
          />
          
          <SidebarItem
            icon={<FileText className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={isPharmacistSectionActive('prescriptions')}
            onClick={() => navigateToDoctorView('prescriptions')}
          />
          
          <SidebarItem
            icon={<Video className="w-5 h-5 mr-3" />}
            label="Teleconsultations"
            isActive={isPharmacistSectionActive('teleconsultations')}
            onClick={() => navigateToDoctorView('teleconsultations')}
          />
          
          <SidebarItem
            icon={<Stamp className="w-5 h-5 mr-3" />}
            label="Stamp & Signature"
            isActive={isPharmacistSectionActive('stamp')}
            onClick={() => navigateToDoctorView('profile', 'stamp', 'profileTab')}
          />
          
          <SidebarCollapsibleItem 
            icon={<UserCircle className="w-5 h-5 mr-3" />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={isPharmacistSectionActive('profile')}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            <SidebarSubItem
              icon={<UserCircle className="w-4 h-4 mr-3" />}
              label="Personal Info"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'personal')}
              onClick={() => navigateToDoctorView('profile', 'personal', 'profileTab')}
            />
            <SidebarSubItem
              icon={<MapPin className="w-4 h-4 mr-3" />}
              label="Addresses"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'addresses')}
              onClick={() => navigateToDoctorView('profile', 'addresses', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Users className="w-4 h-4 mr-3" />}
              label="Next of Kin"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'nextofkin')}
              onClick={() => navigateToDoctorView('profile', 'nextofkin', 'profileTab')}
            />
            <SidebarSubItem
              icon={<Stamp className="w-4 h-4 mr-3" />}
              label="Stamp & Signature"
              isActive={isPharmacistTabActive('profile', 'profileTab', 'stamp')}
              onClick={() => navigateToDoctorView('profile', 'stamp', 'profileTab')}
            />
          </SidebarCollapsibleItem>
          
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
            label="Settings"
            isActive={isPharmacistSectionActive('settings')}
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

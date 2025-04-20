
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users, ShoppingBag, FileText, UserCircle,
  LayoutDashboard, MapPin, Video, Stethoscope,
  Calendar, HeartPulse, Building, Share, CreditCard
} from "lucide-react";
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";
import SidebarCollapsibleItem from "../SidebarCollapsibleItem";
import SidebarSubItem from "../SidebarSubItem";
import { useSidebarNavigation } from "../hooks/useSidebarNavigation";

interface DoctorPlatformSectionProps {
  canPrescribe: boolean;
  canViewPrescriptions: boolean;
}

const DoctorPlatformSection: React.FC<DoctorPlatformSectionProps> = ({
  canPrescribe,
  canViewPrescriptions
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  const {
    isProfileOpen,
    setIsProfileOpen,
    isConsultationsOpen,
    setIsConsultationsOpen,
    isWorkplacesOpen,
    setIsWorkplacesOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    navigateToLink
  } = useSidebarNavigation("doctor");

  // Helper to handle platform links as in original DoctorSidebar
  const navigateToDoctorView = (section: string, tab?: string, tabParam?: string) => {
    if (location.pathname.includes('/doctor/profile')) {
      if (tab && tabParam) {
        navigate(`/dashboard?view=doctor&section=${section}&${tabParam}=${tab}`);
      } else {
        navigate(`/dashboard?view=doctor&section=${section}`);
      }
      return;
    }
    if (tab && tabParam) {
      const path = `?view=doctor&section=${section}&${tabParam}=${tab}`;
      navigateToLink(path);
    } else {
      const path = `?view=doctor&section=${section}`;
      navigateToLink(path);
    }
  };

  return (
    <SidebarSection title="Platform">
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
        icon={<Share className="w-5 h-5 mr-3" />}
        label="Referral"
        isActive={location.pathname === "/referral"}
        onClick={() => navigate("/referral")}
      />
      <SidebarCollapsibleItem 
        icon={<ShoppingBag className="w-5 h-5 mr-3" />}
        label="Orders"
        isOpen={isOrdersOpen}
        isActive={section === "orders"}
        onOpenChange={setIsOrdersOpen}
      >
        <SidebarSubItem
          icon={<ShoppingBag className="w-4 h-4 mr-3" />}
          label="All Orders"
          isActive={section === "orders" && (!searchParams.get("ordersTab") || searchParams.get("ordersTab") === "orders")}
          onClick={() => navigateToDoctorView('orders', 'orders', 'ordersTab')}
        />
        <SidebarSubItem
          icon={<CreditCard className="w-4 h-4 mr-3" />}
          label="Payments"
          isActive={section === "orders" && searchParams.get("ordersTab") === "payments"}
          onClick={() => navigateToDoctorView('orders', 'payments', 'ordersTab')}
        />
      </SidebarCollapsibleItem>
      {canViewPrescriptions && (
        <SidebarItem
          icon={<FileText className="w-5 h-5 mr-3" />}
          label="Prescriptions"
          isActive={section === "prescriptions"}
          onClick={() => navigateToDoctorView('prescriptions')}
        />
      )}
      <SidebarCollapsibleItem 
        icon={<HeartPulse className="w-5 h-5 mr-3" />}
        label="Consultations"
        isOpen={isConsultationsOpen}
        isActive={section === "teleconsultations" || section === "appointments"}
        onOpenChange={setIsConsultationsOpen}
      >
        <SidebarSubItem
          icon={<Video className="w-4 h-4 mr-3" />}
          label="Teleconsultations"
          isActive={section === "teleconsultations"}
          onClick={() => navigateToDoctorView('teleconsultations')}
        />
        <SidebarSubItem
          icon={<Calendar className="w-4 h-4 mr-3" />}
          label="Appointments"
          isActive={section === "appointments"}
          onClick={() => navigateToDoctorView('appointments')}
        />
      </SidebarCollapsibleItem>
      <SidebarCollapsibleItem 
        icon={<Building className="w-5 h-5 mr-3" />}
        label="Workplaces"
        isOpen={isWorkplacesOpen}
        isActive={section === "workplaces"}
        onOpenChange={setIsWorkplacesOpen}
      >
        <SidebarSubItem
          icon={<Building className="w-4 h-4 mr-3" />}
          label="Workplace Selection"
          isActive={section === "workplaces" && (!searchParams.get("workplacesTab") || searchParams.get("workplacesTab") === "selection")}
          onClick={() => navigateToDoctorView('workplaces', 'selection', 'workplacesTab')}
        />
        <SidebarSubItem
          icon={<Calendar className="w-4 h-4 mr-3" />}
          label="Availability"
          isActive={section === "workplaces" && searchParams.get("workplacesTab") === "availability"}
          onClick={() => navigateToDoctorView('workplaces', 'availability', 'workplacesTab')}
        />
      </SidebarCollapsibleItem>
      <SidebarCollapsibleItem 
        icon={<UserCircle className="w-5 h-5 mr-3" />}
        label="Profile"
        isOpen={isProfileOpen}
        isActive={section === "profile"}
        onOpenChange={setIsProfileOpen}
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
    </SidebarSection>
  );
};

export default DoctorPlatformSection;

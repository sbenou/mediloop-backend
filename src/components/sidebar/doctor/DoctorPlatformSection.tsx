
import React from "react";
import { useLocation } from "react-router-dom";
import { Home, Users, FileText, HeartPulse, ShoppingBag, CreditCard, Video, Calendar, Share } from "lucide-react";
import SidebarItem from "../SidebarItem";
import SidebarCollapsibleItem from "../SidebarCollapsibleItem";
import SidebarSubItem from "../SidebarSubItem";
import { useSidebarNavigation } from "@/hooks/sidebar/useSidebarNavigation";
import SidebarSection from "../SidebarSection";

interface DoctorPlatformSectionProps {
  canPrescribe?: boolean;
  canViewPrescriptions?: boolean;
}

const DoctorPlatformSection = ({ 
  canPrescribe = false,
  canViewPrescriptions = false
}: DoctorPlatformSectionProps) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isConsultationsOpen,
    setIsConsultationsOpen,
    isProfileOpen,
    setIsProfileOpen,
    navigateToLink,
    isSectionActive
  } = useSidebarNavigation("doctor");
  
  return (
    <div className="flex flex-col space-y-1">
      <SidebarSection title="PLATFORM">
        <div className="mb-4" /> {/* Increased space between PLATFORM header and Dashboard */}
        
        <SidebarItem
          icon={<Home className="w-5 h-5 mr-3" />}
          label="Dashboard"
          isActive={section === "dashboard"}
          onClick={() => navigateToLink("?section=dashboard")}
        />
        
        <SidebarItem
          icon={<Users className="w-5 h-5 mr-3" />}
          label="Patients"
          isActive={section === "patients"}
          onClick={() => navigateToLink("?section=patients")}
        />
        
        {/* Profile Section */}
        <SidebarCollapsibleItem
          icon={<Users className="w-5 h-5 mr-3" />}
          label="Profile"
          isOpen={isProfileOpen}
          isActive={section === "profile"}
          onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
        >
          <SidebarSubItem
            icon={<Users className="w-4 h-4 mr-3" />}
            label="Personal Details"
            isActive={section === "profile" && searchParams.get("profileTab") === "personal"}
            onClick={() => navigateToLink("?section=profile&profileTab=personal")}
          />
          <SidebarSubItem
            icon={<Users className="w-4 h-4 mr-3" />}
            label="Addresses"
            isActive={section === "profile" && searchParams.get("profileTab") === "addresses"}
            onClick={() => navigateToLink("?section=profile&profileTab=addresses")}
          />
        </SidebarCollapsibleItem>
        
        {/* Orders Section */}
        <SidebarCollapsibleItem
          icon={<ShoppingBag className="w-5 h-5 mr-3" />}
          label="Orders"
          isOpen={isOrdersOpen}
          isActive={section === "orders"}
          onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
        >
          <SidebarSubItem
            icon={<ShoppingBag className="w-4 h-4 mr-3" />}
            label="Orders"
            isActive={section === "orders" && ordersTab === "orders"}
            onClick={() => navigateToLink("?section=orders&ordersTab=orders")}
          />
          <SidebarSubItem
            icon={<CreditCard className="w-4 h-4 mr-3" />}
            label="Payments"
            isActive={section === "orders" && ordersTab === "payments"}
            onClick={() => navigateToLink("?section=orders&ordersTab=payments")}
          />
        </SidebarCollapsibleItem>
        
        {/* Consultations Section */}
        <SidebarCollapsibleItem
          icon={<HeartPulse className="w-5 h-5 mr-3" />}
          label="Consultations"
          isOpen={isConsultationsOpen}
          isActive={section === "teleconsultations" || section === "appointments"}
          onOpenChange={(isOpen) => setIsConsultationsOpen(isOpen)}
        >
          <SidebarSubItem
            icon={<Video className="w-4 h-4 mr-3" />}
            label="Teleconsultations"
            isActive={section === "teleconsultations"}
            onClick={() => navigateToLink("?section=teleconsultations")}
          />
          <SidebarSubItem
            icon={<Calendar className="w-4 h-4 mr-3" />}
            label="Appointments"
            isActive={section === "appointments"}
            onClick={() => navigateToLink("?section=appointments")}
          />
        </SidebarCollapsibleItem>
        
        {/* Referral Link */}
        <SidebarItem
          icon={<Share className="w-5 h-5 mr-3" />}
          label="Referral"
          isActive={location.pathname === "/referral"}
          onClick={() => navigateToLink("/referral")}
        />
        
        {(canViewPrescriptions || canPrescribe) && (
          <SidebarItem
            icon={<FileText className="w-5 h-5 mr-3" />}
            label="Prescriptions"
            isActive={section === "prescriptions"}
            onClick={() => navigateToLink("?section=prescriptions")}
          />
        )}
      </SidebarSection>
    </div>
  );
};

export default DoctorPlatformSection;

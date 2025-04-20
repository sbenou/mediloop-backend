
import React from "react";
import { useLocation } from "react-router-dom";
import { Home, Users, FileText, HeartPulse, ShoppingBag, CreditCard } from "lucide-react";
import SidebarItem from "../SidebarItem";
import SidebarCollapsibleItem from "../SidebarCollapsibleItem";
import SidebarSubItem from "../SidebarSubItem";
import { useSidebarNavigation } from "@/hooks/sidebar/useSidebarNavigation";

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
    navigateToLink,
    isSectionActive
  } = useSidebarNavigation("doctor");
  
  return (
    <div className="flex flex-col space-y-1">
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
      
      {(canViewPrescriptions || canPrescribe) && (
        <SidebarItem
          icon={<FileText className="w-5 h-5 mr-3" />}
          label="Prescriptions"
          isActive={section === "prescriptions"}
          onClick={() => navigateToLink("?section=prescriptions")}
        />
      )}
      
      <SidebarItem
        icon={<HeartPulse className="w-5 h-5 mr-3" />}
        label="Teleconsultations"
        isActive={section === "teleconsultations"}
        onClick={() => navigateToLink("?section=teleconsultations")}
      />
      
      <SidebarItem
        icon={<HeartPulse className="w-5 h-5 mr-3" />}
        label="Appointments"
        isActive={section === "appointments"}
        onClick={() => navigateToLink("?section=appointments")}
      />
    </div>
  );
};

export default DoctorPlatformSection;

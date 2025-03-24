
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ProfileView, 
  SettingsView, 
  OrdersView, 
  PrescriptionsView,
  HomeView,
  PharmacyView
} from "@/components/dashboard/views";
import TeleconsultationsView from "@/components/dashboard/views/TeleconsultationsView";
import DoctorPatientView from "@/components/dashboard/views/doctor/DoctorPatientView";
import DoctorPrescriptionsView from "@/components/dashboard/views/doctor/DoctorPrescriptionsView";
import DoctorTeleconsultationsView from "@/components/dashboard/views/doctor/DoctorTeleconsultationsView";

interface DashboardRouterProps {
  userRole: string;
}

const DashboardRouter: React.FC<DashboardRouterProps> = ({ userRole }) => {
  const [searchParams] = useSearchParams();
  const { isPharmacist } = useAuth();

  // Get all possible URL parameters
  const view = searchParams.get("view") || "home";
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  
  console.log("DashboardRouter rendering:", { userRole, view, section, profileTab, ordersTab });
  
  // For pharmacists, always show pharmacy views regardless of URL parameter
  if (userRole === "pharmacist" || isPharmacist) {
    console.log("Rendering PharmacyView for pharmacist with section:", section);
    return <PharmacyView userRole={userRole} section={section} />;
  }
  
  // For doctors, handle special views
  if (userRole === "doctor") {
    console.log("Handling doctor view with section:", section);
    switch (section) {
      case "profile":
        return <ProfileView activeTab={profileTab} userRole="doctor" />;
      case "settings":
        return <SettingsView userRole="doctor" />;
      case "prescriptions":
        return <DoctorPrescriptionsView />;
      case "patients":
        return <DoctorPatientView />;
      case "teleconsultations":
        return <DoctorTeleconsultationsView />;
      case "dashboard":
      default:
        return <HomeView userRole="doctor" />;
    }
  }
  
  // For patients (or any other role), handle based on view parameter
  console.log("Handling patient view:", view);
  switch (view) {
    case "profile":
      return <ProfileView activeTab={profileTab} userRole={userRole} />;
    case "settings":
      return <SettingsView userRole={userRole} />;
    case "orders":
      return <OrdersView activeTab={ordersTab} userRole={userRole} />;
    case "prescriptions":
      return <PrescriptionsView userRole={userRole} />;
    case "teleconsultations":
      return <TeleconsultationsView userRole={userRole} />;
    case "home":
    default:
      return <HomeView userRole={userRole} />;
  }
};

export default DashboardRouter;

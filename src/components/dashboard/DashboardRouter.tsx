
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import useDashboardParams from "@/hooks/dashboard/useDashboardParams";
import { useSearchParams } from "react-router-dom";
import { 
  ProfileView, 
  SettingsView, 
  OrdersView, 
  PrescriptionsView,
  HomeView,
  PharmacyView,
  WorkplacesView
} from "@/components/dashboard/views";
import TeleconsultationsView from "@/components/dashboard/views/TeleconsultationsView";
import DoctorPatientView from "@/components/dashboard/views/doctor/DoctorPatientView";
import DoctorPrescriptionsView from "@/components/dashboard/views/doctor/DoctorPrescriptionsView";
import DoctorTeleconsultationsView from "@/components/dashboard/views/doctor/DoctorTeleconsultationsView";
import DoctorAppointmentsView from "@/components/dashboard/views/doctor/DoctorAppointmentsView";
import NotificationsView from "@/components/dashboard/views/NotificationsView";

interface DashboardRouterProps {
  userRole: string;
  forcePatientView?: boolean;
}

const DashboardRouter: React.FC<DashboardRouterProps> = ({
  userRole,
  forcePatientView = false,
}) => {
  const { isPharmacist, profile } = useAuth();
  const { params } = useDashboardParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { view, section, profileTab, ordersTab } = params;
  
  useEffect(() => {
    if (userRole === "pharmacist" || isPharmacist) {
      // For pharmacist users, simply set view=pharmacy and section=dashboard if no section
      // This simplifies the approach by just ensuring pharmacists have a default view
      if (!section) {
        setSearchParams({ view: 'pharmacy', section: 'dashboard' }, { replace: true });
      }
    }
  }, [userRole, isPharmacist, section, setSearchParams]);
  
  // For pharmacists, always show pharmacy views unless patient-view is explicitly requested.
  if (!forcePatientView && (userRole === "pharmacist" || isPharmacist)) {
    const sectionToUse = section || "dashboard";
    return <PharmacyView userRole={userRole} section={sectionToUse} />;
  }
  
  // For doctors, handle special views based on section parameter
  if (!forcePatientView && userRole === "doctor") {
    // Check for section parameter first (doctor specific routing)
    if (section) {
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
        case "appointments":
          return <DoctorAppointmentsView />;
        case "workplaces":
          return <WorkplacesView />;
        case "notifications":
          return <NotificationsView userRole="doctor" />;
        case "orders":
          return <OrdersView activeTab={ordersTab || "orders"} userRole="doctor" />;
        case "dashboard":
        default:
          return <HomeView userRole="doctor" />;
      }
    }
    
    // Fallback to view parameter for backward compatibility
    if (view) {
      switch (view) {
        case "profile":
          return <ProfileView activeTab={profileTab} userRole="doctor" />;
        case "settings":
          return <SettingsView userRole="doctor" />;
        case "prescriptions":
          return <DoctorPrescriptionsView />;
        case "teleconsultations":
          return <DoctorTeleconsultationsView />;
        case "notifications":
          return <NotificationsView userRole="doctor" />;
        case "orders":
          return <OrdersView activeTab={ordersTab || "orders"} userRole="doctor" />;
        default:
          return <HomeView userRole="doctor" />;
      }
    }
    
    // Default view if no parameters are provided
    return <HomeView userRole="doctor" />;
  }
  
  // For patients (or any other role), handle based on view parameter
  const patientViewRole = forcePatientView ? "patient" : userRole;
  switch (view) {
    case "profile":
      return <ProfileView activeTab={profileTab} userRole={patientViewRole} />;
    case "settings":
      return <SettingsView userRole={patientViewRole} />;
    case "orders":
      return <OrdersView activeTab={ordersTab} userRole={patientViewRole} />;
    case "prescriptions":
      return <PrescriptionsView userRole={patientViewRole} />;
    case "teleconsultations":
      return <TeleconsultationsView userRole={patientViewRole} />;
    case "notifications":
      return <NotificationsView userRole={patientViewRole} />;
    case "home":
    default:
      return <HomeView userRole={patientViewRole} />;
  }
};

export default DashboardRouter;

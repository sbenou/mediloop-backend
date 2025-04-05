
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import useDashboardParams from "@/hooks/dashboard/useDashboardParams";
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
import DoctorAppointmentsView from "@/components/dashboard/views/doctor/DoctorAppointmentsView";
import NotificationsView from "@/components/dashboard/views/NotificationsView";

interface DashboardRouterProps {
  userRole: string;
}

const DashboardRouter: React.FC<DashboardRouterProps> = ({ userRole }) => {
  const { isPharmacist } = useAuth();
  const { params } = useDashboardParams();
  const { view, section, profileTab, ordersTab } = params;
  
  console.log("🚦 DashboardRouter rendering:", { userRole, view, section, profileTab, ordersTab });
  
  if (!userRole) {
    console.warn("[DashboardRouter] Warning: userRole is not defined. Rendering fallback view.");
    return (
      <div className="p-6 border border-red-300 rounded bg-red-50">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Dashboard Error</h2>
        <p className="text-red-600">User role is undefined. Please try logging in again.</p>
      </div>
    );
  }
  
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
      case "appointments":
        return <DoctorAppointmentsView />;
      case "notifications":
        return <NotificationsView userRole="doctor" />;
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
    case "notifications":
      return <NotificationsView userRole={userRole} />;
    case "home":
    default:
      return <HomeView userRole={userRole} />;
  }
};

export default DashboardRouter;

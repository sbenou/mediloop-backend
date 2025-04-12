
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import useDashboardParams from "@/hooks/dashboard/useDashboardParams";
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
        <button 
          onClick={() => window.location.href = "/login"}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }
  
  try {
    // For pharmacists, handle the view based on section parameter
    if (userRole === "pharmacist" || isPharmacist) {
      // If we're on the pharmacy view with a section or without any params, show the pharmacy view
      if (view === "pharmacy" || (!view && !section)) {
        console.log("Rendering PharmacyView for pharmacist with section:", section || "dashboard");
        return <PharmacyView userRole={userRole} section={section || "dashboard"} />;
      }
      
      // For non-pharmacy views (profile, settings, etc.), show the appropriate view
      console.log("Rendering alternative view for pharmacist:", view);
      
      switch (view) {
        case "profile":
          return <ProfileView activeTab={profileTab} userRole={userRole} />;
        case "settings":
          return <SettingsView userRole={userRole} />;
        default:
          // Default to the pharmacy dashboard if no specific view is requested
          console.log("Defaulting to pharmacy dashboard");
          return <PharmacyView userRole={userRole} section={section || "dashboard"} />;
      }
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
        case "workplaces":
          return <WorkplacesView />;
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
  } catch (error) {
    console.error("Error in DashboardRouter:", error);
    return (
      <div className="p-6 border border-red-300 rounded bg-red-50">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Dashboard Error</h2>
        <p className="text-red-600">There was an error loading the dashboard. Please try refreshing the page.</p>
        <pre className="mt-4 p-4 bg-red-100 text-red-800 overflow-auto text-xs">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
};

export default DashboardRouter;

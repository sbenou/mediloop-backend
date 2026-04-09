
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

/** Sidebar / deep links that must stay on workspace UI even if `mode=patient` (marketplace). */
const PHARMACY_PROFESSIONAL_SECTIONS = new Set([
  "prescriptions",
  "patients",
  "orders",
  "settings",
  "profile",
  "notifications",
]);

interface DashboardRouterProps {
  userRole: string;
  forcePatientView?: boolean;
}

const DashboardRouter: React.FC<DashboardRouterProps> = ({
  userRole,
  forcePatientView = false,
}) => {
  const { isPharmacist } = useAuth();
  const { params } = useDashboardParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { view, section, profileTab, ordersTab } = params;
  /** Raw query value — `useDashboardParams` defaults missing section to "dashboard", which broke this effect. */
  const sectionInUrl = searchParams.get("section");
  const viewInUrl = searchParams.get("view");
  const patientBrowseMode = searchParams.get("mode") === "patient";

  useEffect(() => {
    if (!(userRole === "pharmacist" || isPharmacist)) return;
    // Browsing marketplace as patient: don't inject pharmacy query params.
    if (
      patientBrowseMode &&
      !(sectionInUrl && PHARMACY_PROFESSIONAL_SECTIONS.has(sectionInUrl))
    ) {
      return;
    }
    if (sectionInUrl == null || sectionInUrl === "") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("view", "pharmacy");
          next.set("section", "dashboard");
          return next;
        },
        { replace: true },
      );
    } else if (!viewInUrl) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("view", "pharmacy");
          return next;
        },
        { replace: true },
      );
    }
  }, [
    userRole,
    isPharmacist,
    sectionInUrl,
    viewInUrl,
    patientBrowseMode,
    setSearchParams,
  ]);

  if (userRole === "pharmacist" || isPharmacist) {
    const wantsProfessionalSurface =
      Boolean(sectionInUrl && PHARMACY_PROFESSIONAL_SECTIONS.has(sectionInUrl));
    if (wantsProfessionalSurface || !forcePatientView) {
      const sectionToUse =
        sectionInUrl && sectionInUrl !== ""
          ? sectionInUrl
          : section || "dashboard";
      return <PharmacyView userRole={userRole} section={sectionToUse} />;
    }
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

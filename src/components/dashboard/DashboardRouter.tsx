
import React, { useEffect } from "react";
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
import WorkplacesView from "@/components/dashboard/views/doctor/WorkplacesView";
import NotificationsView from "@/components/dashboard/views/NotificationsView";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

interface DashboardRouterProps {
  userRole: string;
}

const DashboardRouter: React.FC<DashboardRouterProps> = ({ userRole }) => {
  const { isPharmacist, profile } = useAuth();
  const { params } = useDashboardParams();
  const { view, section, profileTab, ordersTab } = params;
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    console.log("🚦 DashboardRouter rendering with:", { 
      userRole, 
      view, 
      section, 
      profileTab, 
      ordersTab, 
      isPharmacist: isPharmacist || userRole === 'pharmacist',
      profileRole: profile?.role,
      navigationSource: sessionStorage.getItem('dashboard_navigation_source'),
      skipRedirect: sessionStorage.getItem('skip_dashboard_redirect')
    });
    
    // Check if we should skip the redirection
    const skipRedirect = sessionStorage.getItem('skip_dashboard_redirect') === 'true';
    if (skipRedirect) {
      console.log("Skipping parameter correction due to skip_dashboard_redirect flag");
      // Clear the flag after we've used it
      setTimeout(() => {
        sessionStorage.removeItem('skip_dashboard_redirect');
      }, 500);
      return;
    }
    
    // If navigation came from menu, don't try to redirect
    const fromMenu = sessionStorage.getItem('dashboard_navigation_source') === 'menu';
    if (fromMenu) {
      console.log("Navigation came from menu, skipping parameter correction");
      sessionStorage.removeItem('dashboard_navigation_source');
      return;
    }
    
    // Get the correct route for the current user role
    const expectedRoute = getDashboardRouteByRole(userRole);
    const expectedParams = new URLSearchParams(expectedRoute.split('?')[1] || '');
    
    // Check if current parameters match expected ones
    let needsParameterUpdate = false;
    
    // For pharmacists
    if (userRole === 'pharmacist' || isPharmacist || profile?.role === 'pharmacist') {
      if (view !== 'pharmacy') {
        needsParameterUpdate = true;
      }
    }
    // For doctors
    else if (userRole === 'doctor') {
      if (!section) {
        needsParameterUpdate = true;
      }
    }
    // For patients/users
    else if (userRole === 'user' || userRole === 'patient') {
      if (!view) {
        needsParameterUpdate = true;
      }
    }
    
    if (needsParameterUpdate) {
      console.log("Correcting URL parameters for", userRole);
      
      // Get current redirect count from sessionStorage
      const redirectAttempts = parseInt(sessionStorage.getItem('dashboard_redirect_count') || '0');
      
      // Only redirect if we haven't tried too many times
      if (redirectAttempts < 2) {
        // Increment the counter and save it
        sessionStorage.setItem('dashboard_redirect_count', (redirectAttempts + 1).toString());
        
        // Update the URL parameters using the utility function
        const urlParams = new URLSearchParams(expectedRoute.split('?')[1] || '');
        setSearchParams(urlParams, { replace: true });
        
        // Only show toast on first attempt
        if (redirectAttempts === 0) {
          toast({
            title: "Dashboard",
            description: `Loading your ${userRole} dashboard view`,
          });
        }
      } else {
        console.log("Maximum redirect attempts reached, continuing with current parameters");
      }
    } else {
      // If parameters are correct, reset the counter
      sessionStorage.removeItem('dashboard_redirect_count');
    }
  }, [userRole, view, section, profileTab, ordersTab, isPharmacist, profile, searchParams, setSearchParams]);
  
  // Reset the redirect counter when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('dashboard_redirect_count');
    };
  }, []);
  
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
  
  // For pharmacists, always show pharmacy views regardless of URL parameter
  if (userRole === "pharmacist" || isPharmacist || profile?.role === 'pharmacist') {
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
};

export default DashboardRouter;

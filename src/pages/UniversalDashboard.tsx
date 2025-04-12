
import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
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
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationsView from "@/components/dashboard/views/NotificationsView";

const UniversalDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, isLoading, isPharmacist, profile } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const currentView = searchParams.get("view") || "home";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  const profileTab = searchParams.get("profileTab") || "personal";
  const pharmacySection = searchParams.get("section") || "dashboard";
  
  // Console logging for debugging
  useEffect(() => {
    console.log("UniversalDashboard render:", { 
      userRole, 
      isPharmacist,
      profile: profile?.role,
      currentView, 
      pharmacySection,
      searchParams: Object.fromEntries(searchParams.entries()),
      location: location.pathname + location.search
    });
  }, [userRole, currentView, pharmacySection, searchParams, location, isPharmacist, profile]);
  
  // Make sure we have default parameters set for role-specific views on initial load
  useEffect(() => {
    if (!isLoading && !isInitialLoad) {
      console.log("Setting default parameters for role:", userRole, isPharmacist);
      
      // For pharmacists, ensure we have view=pharmacy and section parameter
      if ((userRole === "pharmacist" || isPharmacist) && 
          (currentView !== 'pharmacy' || !searchParams.get("section"))) {
        console.log("Setting default pharmacist params");
        setSearchParams({ view: 'pharmacy', section: 'dashboard' }, { replace: true });
        return;
      }
      
      // For doctors, ensure we have a section parameter if not already present
      if (userRole === "doctor" && !searchParams.get("section") && !searchParams.has("view")) {
        console.log("Setting default doctor params");
        setSearchParams({ section: 'dashboard' }, { replace: true });
        return;
      }
    }
  }, [userRole, isPharmacist, isLoading, isInitialLoad, currentView, searchParams, setSearchParams]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);
  
  const getContent = () => {
    try {
      // For pharmacists, always show the pharmacy view regardless of the URL parameter
      if (userRole === "pharmacist" || isPharmacist) {
        console.log("Rendering PharmacyView with section:", pharmacySection);
        return <PharmacyView userRole={userRole} section={pharmacySection} />;
      }
      
      // For other roles, show the view based on the URL parameter
      switch (currentView) {
        case "profile":
          return <ProfileView activeTab={profileTab} userRole={userRole} />;
        case "settings":
          return <SettingsView userRole={userRole} />;
        case "orders":
          return <OrdersView activeTab={ordersTab} userRole={userRole} />;
        case "prescriptions":
          return <PrescriptionsView userRole={userRole} />;
        case "pharmacy":
          // This case is for non-pharmacists who might access the pharmacy view
          return <PharmacyView userRole={userRole} section={pharmacySection} />;
        case "teleconsultations":
          return <TeleconsultationsView userRole={userRole} />;
        case "notifications":
          return <NotificationsView userRole={userRole} />;
        case "home":
        default:
          return <HomeView userRole={userRole} />;
      }
    } catch (error) {
      console.error("Error rendering dashboard content:", error);
      return (
        <div className="p-6 border border-red-300 rounded bg-red-50">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Dashboard Error</h2>
          <p className="text-red-600">There was an error loading the dashboard content. Please try refreshing the page.</p>
          <pre className="mt-4 p-4 bg-red-100 text-red-800 overflow-auto text-xs">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      );
    }
  };
  
  // Show loading skeleton only on initial load, not during navigation
  if (isInitialLoad && isLoading) {
    return (
      <UnifiedLayoutTemplate>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </UnifiedLayoutTemplate>
    );
  }
  
  // Use the UnifiedLayoutTemplate for all roles
  return (
    <UnifiedLayoutTemplate>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          {getContent()}
        </ScrollArea>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default UniversalDashboard;


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
  
  // Make sure we have a default section for pharmacists - with more aggressive redirect
  useEffect(() => {
    if (!isLoading && (userRole === "pharmacist" || isPharmacist || profile?.role === "pharmacist")) {
      console.log("Checking pharmacist params:", { currentView, pharmacySection, isPharmacist });
      
      const isPharmacistWithWrongParams = currentView !== 'pharmacy' || !pharmacySection;
      
      if (isPharmacistWithWrongParams) {
        console.log("Detected pharmacist with incorrect URL parameters. Fixing...");
        
        // Use a direct window.location update for complete reliability
        if (location.pathname === '/dashboard') {
          const correctUrl = '/dashboard?view=pharmacy&section=dashboard';
          console.log(`Hard redirecting pharmacist to: ${correctUrl}`);
          window.location.href = correctUrl;
          return;
        }
        
        // As a backup, try React Router navigation
        setSearchParams({ view: 'pharmacy', section: 'dashboard' }, { replace: true });
      }
    }
  }, [userRole, setSearchParams, currentView, pharmacySection, isLoading, isPharmacist, profile, location, navigate]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);
  
  const getContent = () => {
    // For pharmacists, always show the pharmacy view regardless of the URL parameter
    if (userRole === "pharmacist" || isPharmacist || profile?.role === "pharmacist") {
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

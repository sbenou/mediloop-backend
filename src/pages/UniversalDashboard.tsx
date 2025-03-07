
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const UniversalDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const currentView = searchParams.get("view") || "home";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  const profileTab = searchParams.get("profileTab") || "personal";
  const pharmacySection = searchParams.get("section") || "dashboard";
  
  // Make sure we have a default section for pharmacists
  useEffect(() => {
    if (userRole === "pharmacist" && !searchParams.get("section") && !searchParams.get("view")) {
      setSearchParams({ view: 'pharmacy', section: 'dashboard' });
    }
  }, [userRole, searchParams, setSearchParams]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (after initial load)
    if (!isInitialLoad && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isInitialLoad, navigate]);
  
  const getContent = () => {
    // For pharmacists, always show the pharmacy view regardless of the URL parameter
    if (userRole === "pharmacist") {
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
        return <PharmacyView userRole={userRole} section={pharmacySection} />;
      case "teleconsultations":
        return <TeleconsultationsView userRole={userRole} />;
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


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

const UniversalDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading } = useAuth();
  
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
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
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
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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

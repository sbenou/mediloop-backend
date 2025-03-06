
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ProfileView, 
  SettingsView, 
  OrdersView, 
  PrescriptionsView,
  TeleconsultationsView,
  HomeView,
  PharmacyView
} from "@/components/dashboard/views";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

const UniversalDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading } = useAuth();
  
  const currentView = searchParams.get("view") || "home";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  const profileTab = searchParams.get("profileTab") || "personal";
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const handleTabChange = (value: string) => {
    setSearchParams({ view: value });
  };
  
  // This function determines which tabs are displayed based on the user's role
  const getRoleTabs = () => {
    const commonTabs = [
      { value: "home", label: "Home" },
      { value: "profile", label: "Profile" },
      { value: "settings", label: "Settings" },
    ];
    
    if (userRole === "patient") {
      return [
        ...commonTabs,
        { value: "orders", label: "Orders" },
        { value: "prescriptions", label: "Prescriptions" },
        { value: "teleconsultations", label: "Teleconsultations" },
      ];
    }
    
    if (userRole === "pharmacist") {
      return [
        ...commonTabs,
        { value: "pharmacy", label: "Pharmacy Dashboard" },
        { value: "inventory", label: "Inventory" },
      ];
    }
    
    // Default tabs for other roles or fallback
    return commonTabs;
  };
  
  const getContent = () => {
    switch (currentView) {
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
      case "pharmacy":
        return <PharmacyView userRole={userRole} />;
      case "home":
      default:
        return <HomeView userRole={userRole} />;
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  const tabs = getRoleTabs();
  
  return (
    <UnifiedLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <Tabs value={currentView} onValueChange={handleTabChange}>
          <TabsList className="mb-8">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div>{getContent()}</div>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
};

export default UniversalDashboard;

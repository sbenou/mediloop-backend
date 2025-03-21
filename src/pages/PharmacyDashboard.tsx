
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  HomeView,
  InventoryView,
  OrdersView,
  PharmacyProfileView,
  PharmacySettingsView,
  PharmacyStaffView,
  PrescriptionsView
} from "@/components/dashboard/views/pharmacy";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

const PharmacyDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile, isPharmacist } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMounted, setIsMounted] = useState(true);
  const [hasRendered, setHasRendered] = useState(false);
  
  // Component lifecycle management
  useEffect(() => {
    console.log("PharmacyDashboard component mounted");
    setIsMounted(true);
    console.log("Auth state:", { isAuthenticated, userRole, isPharmacist, isLoading });
    
    // Force a re-render after initial mounting to ensure we have the latest auth state
    if (!hasRendered) {
      setTimeout(() => {
        if (isMounted) {
          setHasRendered(true);
        }
      }, 100);
    }
    
    return () => {
      console.log("PharmacyDashboard component unmounted");
      setIsMounted(false);
    };
  }, [isAuthenticated, userRole, isPharmacist, isLoading, hasRendered]);
  
  // Track initial load state
  useEffect(() => {
    if (!isLoading && isMounted) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isMounted]);
  
  // Authentication and role verification
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (after initial load)
    if (!isInitialLoad && !isAuthenticated && isMounted) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login", { replace: true });
      return;
    }
    
    // Redirect to regular dashboard if not a pharmacist
    if (!isInitialLoad && isAuthenticated && userRole !== "pharmacist" && !isPharmacist && isMounted) {
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [isAuthenticated, isInitialLoad, navigate, userRole, isPharmacist, isMounted]);
  
  // Check section param
  useEffect(() => {
    const section = searchParams.get("section") || "dashboard";
    if (!section && isMounted) {
      setSearchParams({ section: "dashboard" }, { replace: true });
    }
  }, [searchParams, setSearchParams, isMounted]);
  
  // Get current section from URL
  const section = searchParams.get("section") || "dashboard";
  
  const getContent = () => {
    switch (section) {
      case "profile":
        return <PharmacyProfileView />;
      case "staff":
        return <PharmacyStaffView />;
      case "inventory":
        return <InventoryView />;
      case "prescriptions":
        return <PrescriptionsView userRole="pharmacist" />;
      case "orders":
        return <OrdersView userRole="pharmacist" activeTab="pending" />;
      case "settings":
        return <PharmacySettingsView />;
      case "dashboard":
      default:
        return <HomeView userRole="pharmacist" />;
    }
  };
  
  // Show loading skeleton during initial load
  if (isInitialLoad && isLoading) {
    return (
      <PharmacistLayout>
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
      </PharmacistLayout>
    );
  }
  
  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          {getContent()}
        </ScrollArea>
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;

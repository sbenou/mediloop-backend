
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ProfileView, 
  SettingsView, 
  PrescriptionsView,
  HomeView
} from "@/components/dashboard/views";
import TeleconsultationsView from "@/components/dashboard/views/TeleconsultationsView";
import DoctorPatientView from "@/components/dashboard/views/doctor/DoctorPatientView";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

const DoctorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const currentView = searchParams.get("view") || "doctor";
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  
  // Console logging for debugging
  useEffect(() => {
    console.log("DoctorDashboard render:", { 
      userRole, 
      currentView, 
      section,
      searchParams: Object.fromEntries(searchParams.entries()),
      location: location.pathname + location.search
    });
  }, [userRole, currentView, section, searchParams, location]);
  
  // Make sure we have a default section for doctors
  useEffect(() => {
    if (userRole === "doctor" && !isInitialLoad && isAuthenticated) {
      console.log("Checking doctor params:", { currentView, section });
      
      if (currentView !== 'doctor' || !section) {
        console.log("Setting default doctor params");
        setSearchParams({ view: 'doctor', section: 'dashboard' }, { replace: true });
      }
    }
  }, [userRole, setSearchParams, currentView, section, isInitialLoad, isAuthenticated]);
  
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
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isInitialLoad, navigate]);
  
  // Redirect to regular dashboard if not a doctor
  useEffect(() => {
    if (!isInitialLoad && isAuthenticated && userRole !== "doctor") {
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isInitialLoad, navigate, userRole]);
  
  const getContent = () => {
    // For the doctor dashboard, show content based on the section
    switch (section) {
      case "profile":
        return <ProfileView activeTab={profileTab} userRole={userRole} />;
      case "settings":
        return <SettingsView userRole={userRole} />;
      case "prescriptions":
        return <PrescriptionsView userRole={userRole} />;
      case "patients":
        return <DoctorPatientView />;
      case "teleconsultations":
        return <TeleconsultationsView userRole={userRole} />;
      case "dashboard":
      default:
        return <HomeView userRole={userRole} />;
    }
  };
  
  // Show loading skeleton only on initial load, not during navigation
  if (isInitialLoad && isLoading) {
    return (
      <DoctorLayout>
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
      </DoctorLayout>
    );
  }
  
  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          {getContent()}
        </ScrollArea>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;

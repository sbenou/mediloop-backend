
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientDashboard from "@/pages/PatientDashboard";
import { toast } from "@/components/ui/use-toast";
import UniversalDashboard from "@/pages/UniversalDashboard";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const view = searchParams.get('view') || 'home';
  const section = searchParams.get('section');

  // Debug logging
  console.log('Dashboard component mounting with:', { 
    isAuthenticated, 
    userRole, 
    profileRole: profile?.role,
    isPharmacist,
    view,
    section
  });

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);

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
  }, [isLoading, isAuthenticated, navigate, isInitialLoad]);

  // Force pharmacist to see their dedicated view - using strict checks
  useEffect(() => {
    if (!isInitialLoad && isAuthenticated) {
      console.log("Checking user role for dashboard view:", { 
        userRole, 
        profileRole: profile?.role,
        isPharmacist 
      });
      
      // Use multiple checks to ensure we correctly identify pharmacists
      const isUserPharmacist = 
        profile?.role === 'pharmacist' || 
        userRole === 'pharmacist' || 
        isPharmacist;
      
      if (isUserPharmacist) {
        console.log("Pharmacist detected - ensuring pharmacy dashboard view");
        
        // If not already on pharmacy view or incorrect section, redirect
        if (view !== 'pharmacy' || (section !== 'dashboard' && !section)) {
          console.log("Setting search params for pharmacy dashboard view");
          setSearchParams({ view: 'pharmacy', section: 'dashboard' });
        }
      }
    }
  }, [profile, view, section, setSearchParams, isInitialLoad, isAuthenticated, isPharmacist, userRole]);

  // Debug logging
  useEffect(() => {
    if (!isInitialLoad) {
      console.log("Dashboard rendering with:", { 
        userRole, 
        profileRole: profile?.role,
        isPharmacist,
        view, 
        section 
      });
    }
  }, [userRole, view, section, isInitialLoad, profile, isPharmacist]);

  // Return the unified dashboard for all users
  return (
    <>
      <RoleDebugger />
      <UniversalDashboard />
    </>
  );
};

export default Dashboard;

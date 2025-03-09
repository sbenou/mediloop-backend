
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

  // For pharmacist role, ensure they see their dedicated view
  useEffect(() => {
    if (!isInitialLoad && isAuthenticated && (profile?.role === 'pharmacist' || isPharmacist)) {
      console.log("Checking pharmacist view:", { 
        view, 
        section, 
        userRole, 
        profileRole: profile?.role,
        isPharmacist 
      });
      
      if (view !== 'pharmacy') {
        console.log("Redirecting pharmacist to proper dashboard view");
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
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

  // Include a debugging component to help identify role issues
  return (
    <>
      <RoleDebugger />
      <UniversalDashboard />
    </>
  );
};

export default Dashboard;

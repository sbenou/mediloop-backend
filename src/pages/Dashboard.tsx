
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientDashboard from "@/pages/PatientDashboard";
import { toast } from "@/components/ui/use-toast";
import UniversalDashboard from "@/pages/UniversalDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const view = searchParams.get('view') || 'home';
  const section = searchParams.get('section');

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
    if ((userRole === 'pharmacist' || isPharmacist) && !isInitialLoad && isAuthenticated) {
      console.log("Checking pharmacist view:", { view, section, isPharmacist, userRole });
      
      if (view !== 'pharmacy' || !section) {
        console.log("Redirecting pharmacist to proper dashboard view");
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
      }
    }
  }, [userRole, view, section, setSearchParams, isInitialLoad, isAuthenticated, isPharmacist]);

  // For doctor role, ensure they see their dedicated view
  useEffect(() => {
    if (userRole === 'doctor' && !isInitialLoad && isAuthenticated) {
      console.log("Checking doctor view:", { view, section, userRole });
      
      if (view !== 'doctor' || !section) {
        console.log("Redirecting doctor to proper dashboard view");
        setSearchParams({ view: 'doctor', section: 'dashboard' });
      }
    }
  }, [userRole, view, section, setSearchParams, isInitialLoad, isAuthenticated]);

  // Debug logging
  useEffect(() => {
    if (!isInitialLoad) {
      console.log("Dashboard rendering with:", { userRole, view, section, isPharmacist });
    }
  }, [userRole, view, section, isInitialLoad, isPharmacist]);

  // For doctor role, provide a dedicated dashboard
  if (userRole === 'doctor') {
    return <DoctorDashboard />;
  }

  // For specific patient view
  if (userRole === 'patient' && !view) {
    return <PatientDashboard />;
  }

  // Otherwise, use the universal dashboard
  return <UniversalDashboard />;
};

export default Dashboard;

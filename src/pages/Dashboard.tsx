import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientDashboard from "@/pages/PatientDashboard";
import { toast } from "@/components/ui/use-toast";
import UniversalDashboard from "@/pages/UniversalDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import { Loader } from "lucide-react";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const view = searchParams.get('view') || 'home';
  const section = searchParams.get('section');

  // Set mounted flag
  useEffect(() => {
    setHasMounted(true);
    console.log("Dashboard component mounted");
    
    // Log current state to help with debugging
    console.log("Dashboard initial state:", { 
      isLoading, 
      isAuthenticated, 
      userRole, 
      isPharmacist,
      view,
      section
    });
    
    return () => {
      console.log("Dashboard component unmounted");
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
      console.log("Initial loading complete, current auth state:", { 
        isAuthenticated, 
        userRole,
        view,
        section
      });
    }
  }, [isLoading, view, section]);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (after initial load)
    if (!isInitialLoad && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
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
      console.log("Processing pharmacist view logic:", { view, section, isPharmacist, userRole });
      
      if (view !== 'pharmacy' || !section) {
        console.log("Redirecting pharmacist to proper dashboard view");
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
      }
    }
  }, [userRole, view, section, setSearchParams, isInitialLoad, isAuthenticated, isPharmacist]);

  // For doctor role, ensure they see their dedicated view
  useEffect(() => {
    if (userRole === 'doctor' && !isInitialLoad && isAuthenticated) {
      console.log("Processing doctor view logic:", { view, section, userRole });
      
      try {
        if (view !== 'doctor' || !section) {
          console.log("Setting doctor dashboard parameters");
          setSearchParams({ view: 'doctor', section: 'dashboard' });
        }
      } catch (error) {
        console.error("Error setting search params for doctor:", error);
        // Fallback to direct navigation if setSearchParams fails
        navigate("/doctor/dashboard");
      }
    }
  }, [userRole, view, section, setSearchParams, isInitialLoad, isAuthenticated, navigate]);

  // Show loading indicator while initial authentication is in progress
  if (isLoading || isInitialLoad) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Debug logging
  if (hasMounted && !isInitialLoad) {
    console.log("Dashboard rendering decision with:", { 
      userRole, 
      view, 
      section, 
      isPharmacist, 
      isAuthenticated 
    });
  }

  // Safety check - show a clear error if something is wrong
  if (!isLoading && isAuthenticated && !userRole) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4 max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-xl font-bold text-red-600">Dashboard Error</h1>
          <p className="text-center">
            We couldn't determine your user role. This may be due to an incomplete profile.
          </p>
          <button 
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // For doctor role, provide a dedicated dashboard
  if (userRole === 'doctor') {
    console.log("Rendering DoctorDashboard component");
    try {
      return <DoctorDashboard />;
    } catch (error) {
      console.error("Error rendering DoctorDashboard:", error);
      // Fallback to universal dashboard if doctor dashboard fails
      return <UniversalDashboard />;
    }
  }

  // For specific patient view
  if (userRole === 'patient' && !view) {
    console.log("Rendering PatientDashboard component");
    return <PatientDashboard />;
  }

  // Otherwise, use the universal dashboard
  console.log("Rendering UniversalDashboard component");
  return <UniversalDashboard />;
};

export default Dashboard;

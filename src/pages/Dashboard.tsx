
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientDashboard from "@/pages/PatientDashboard";
import { toast } from "@/components/ui/use-toast";
import UniversalDashboard from "@/pages/UniversalDashboard";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile } = useAuth();
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
    if (!isInitialLoad && isAuthenticated && profile?.role === 'pharmacist') {
      console.log("Checking pharmacist view:", { view, section, userRole: profile.role });
      
      if (view !== 'pharmacy') {
        console.log("Redirecting pharmacist to proper dashboard view");
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
      }
    }
  }, [profile, view, section, setSearchParams, isInitialLoad, isAuthenticated]);

  // Debug logging
  useEffect(() => {
    if (!isInitialLoad) {
      console.log("Dashboard rendering with:", { userRole, view, section, profileRole: profile?.role });
    }
  }, [userRole, view, section, isInitialLoad, profile]);

  // Use universal dashboard for all user types
  return <UniversalDashboard />;
};

export default Dashboard;

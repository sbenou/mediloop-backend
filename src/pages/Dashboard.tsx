
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientDashboard from "@/pages/PatientDashboard";
import { toast } from "@/components/ui/use-toast";
import UniversalDashboard from "@/pages/UniversalDashboard";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const view = searchParams.get('view') || 'home';
  const ordersTab = searchParams.get('ordersTab') || 'orders';
  const prescriptionsTab = searchParams.get('prescriptionsTab') || 'active';

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
  if (userRole === 'pharmacist' && (!view || view !== 'pharmacy')) {
    navigate("/dashboard?view=pharmacy&section=dashboard", { replace: true });
    return null;
  }

  // For very specific user roles, provide a dedicated dashboard
  if (userRole === 'patient' && !view) {
    return <PatientDashboard />;
  }

  // Otherwise, use the universal dashboard
  return <UniversalDashboard />;
};

export default Dashboard;

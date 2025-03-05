import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientDashboard from "@/pages/PatientDashboard";
import { toast } from "@/components/ui/use-toast";
import UniversalDashboard from "@/pages/UniversalDashboard";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') || 'home';
  const ordersTab = searchParams.get('ordersTab') || 'orders';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // For very specific user roles, provide a dedicated dashboard
  if (userRole === 'patient' && !view) {
    return <PatientDashboard />;
  }

  // Otherwise, use the universal dashboard
  return <UniversalDashboard />;
};

export default Dashboard;

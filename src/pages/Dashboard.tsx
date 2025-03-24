
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { Loader } from "lucide-react";

const Dashboard = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      navigate("/login", { replace: true });
      return;
    }
    
    if (profile) {
      const route = getDashboardRouteByRole(profile.role);
      console.log(`Redirecting ${profile.role} to ${route}`);
      navigate(route, { replace: true });
    }
  }, [isAuthenticated, profile, navigate, isLoading]);

  // Show loading state
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;

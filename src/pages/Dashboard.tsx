
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { useLoginManager } from "@/hooks/auth/useLoginManager";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const { redirected } = useLoginManager();
  const [searchParams] = useSearchParams();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate, isLoading]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the appropriate dashboard based on user role
  if (isAuthenticated && userRole) {
    return (
      <UnifiedLayoutTemplate>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
            <DashboardRouter userRole={userRole} />
          </ScrollArea>
        </div>
      </UnifiedLayoutTemplate>
    );
  }

  // Fallback loading state (should rarely hit this)
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparing your dashboard...</p>
      </div>
    </div>
  );
};

export default Dashboard;

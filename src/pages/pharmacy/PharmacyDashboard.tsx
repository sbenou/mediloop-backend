
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PharmacistLayoutOld from "@/components/layout/PharmacistLayoutOld";
import { toast } from "@/components/ui/use-toast";

const PharmacyDashboard = () => {
  const { profile, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("PharmacyDashboard: Component mounted", { 
      isLoading, 
      isAuthenticated, 
      role: profile?.role 
    });

    if (!isLoading && !isAuthenticated) {
      console.log("PharmacyDashboard: User not authenticated, redirecting to login");
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
    }

    if (!isLoading && isAuthenticated && profile?.role !== "pharmacist") {
      console.log("PharmacyDashboard: User not a pharmacist, redirecting to dashboard");
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to access the pharmacy dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isLoading, isAuthenticated, profile, navigate]);

  // Show an immediate loading state when authentication is in progress
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Also show loading if authentication has completed but the user isn't authenticated as a pharmacist
  if (!isAuthenticated || (profile && profile.role !== "pharmacist")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Checking permissions...</p>
      </div>
    );
  }

  return (
    <PharmacistLayoutOld>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard (Legacy)</h1>
          <p className="text-muted-foreground">
            This is the old version of the pharmacy dashboard for comparison purposes.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            This is the legacy pharmacy dashboard. The new version is available at{" "}
            <a 
              href="/dashboard" 
              className="text-blue-600 underline"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
            >
              /dashboard
            </a>
          </p>
        </div>
      </div>
    </PharmacistLayoutOld>
  );
};

export default PharmacyDashboard;

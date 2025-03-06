
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PharmacistLayoutOld from "@/components/layout/PharmacistLayoutOld";
import { toast } from "@/components/ui/use-toast";

const PharmacyDashboard = () => {
  const { profile, isAuthenticated, isLoading, initialCheckDone } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("PharmacyDashboard: Component mounted", { 
      isLoading, 
      isAuthenticated, 
      role: profile?.role,
      initialCheckDone
    });

    // Only redirect if we're done with the initial auth check
    if (initialCheckDone) {
      if (!isAuthenticated) {
        console.log("PharmacyDashboard: User not authenticated, redirecting to login");
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please login to access the pharmacy dashboard.",
        });
        navigate("/login");
        return;
      }

      if (isAuthenticated && profile?.role !== "pharmacist") {
        console.log("PharmacyDashboard: User not a pharmacist, redirecting to dashboard");
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You don't have permission to access the pharmacy dashboard.",
        });
        navigate("/dashboard");
        return;
      }
    }
  }, [isLoading, isAuthenticated, profile, navigate, initialCheckDone]);

  // Show an improved loading state when authentication is in progress
  if (isLoading || !initialCheckDone) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading authentication...</p>
          <p className="text-sm text-gray-500">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // If not authenticated as a pharmacist, show a loading state
  if (!isAuthenticated || (profile && profile.role !== "pharmacist")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Checking permissions...</p>
          <p className="text-sm text-gray-500">This page is only accessible to pharmacists</p>
        </div>
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

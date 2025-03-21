
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

const PharmacyDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile, isPharmacist } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const redirectAttempted = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Console logging for debugging
  useEffect(() => {
    console.log("PharmacyDashboard render:", { 
      userRole, 
      isPharmacist,
      section,
      searchParams: Object.fromEntries(searchParams.entries()),
      profile
    });
  }, [userRole, section, searchParams, isPharmacist, profile]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (after initial load)
    if (!isInitialLoad && !isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isInitialLoad, navigate]);
  
  // Redirect to regular dashboard if not a pharmacist
  useEffect(() => {
    if (!isInitialLoad && isAuthenticated && !isPharmacist && !redirectAttempted.current) {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isInitialLoad, navigate, isPharmacist]);
  
  // Show loading skeleton only on initial load, not during navigation
  if (isInitialLoad && isLoading) {
    return (
      <PharmacistLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </PharmacistLayout>
    );
  }
  
  // If not authenticated or not a pharmacist, show minimal loading until redirect happens
  if (!isAuthenticated || (isAuthenticated && !isPharmacist)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          <PharmacyView userRole={userRole} section={section} />
        </ScrollArea>
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;

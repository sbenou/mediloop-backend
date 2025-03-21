
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";

const PharmacyDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile, isPharmacist } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectAttempted = useRef(false);
  const initialLoadComplete = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Console logging for debugging
  useEffect(() => {
    console.log("PharmacyDashboard render:", { 
      userRole, 
      isPharmacist,
      section,
      searchParams: Object.fromEntries(searchParams.entries()),
      profile,
      isLoading,
      isAuthenticated
    });
  }, [userRole, section, searchParams, isPharmacist, profile, isLoading, isAuthenticated]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true;
      setIsRedirecting(true);
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Redirect to regular dashboard if not a pharmacist
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPharmacist && !redirectAttempted.current) {
      redirectAttempted.current = true;
      setIsRedirecting(true);
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, isPharmacist]);
  
  // Mark initial load as complete once authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && isPharmacist && !initialLoadComplete.current) {
      initialLoadComplete.current = true;
    }
  }, [isLoading, isAuthenticated, isPharmacist]);
  
  // Show a single unified loading state - but only if initial load not complete
  if ((isLoading || isRedirecting || !isAuthenticated || (isAuthenticated && !isPharmacist)) && !initialLoadComplete.current) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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

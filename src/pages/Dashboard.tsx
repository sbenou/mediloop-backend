
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader, SidebarClose, SidebarOpen } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { CartProvider } from "@/contexts/CartContext";
import DoctorLayout from "@/components/layout/DoctorLayout";
import PatientLayout from "@/components/layout/PatientLayout";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasInitializedRef = useRef(false);
  const redirectedRef = useRef(false);
  
  // Activity drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");

  // Add more detailed logging to help debug
  useEffect(() => {
    // Only perform redirect once and only if needed
    if (!isLoading && !isAuthenticated && !redirectedRef.current) {
      console.warn("🔒 Not authenticated — redirecting to login");
      redirectedRef.current = true;
      navigate("/login", { replace: true });
      return; // Early return to prevent further rendering
    }
    
    // Mark as initialized to prevent multiple redirects
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      console.log("✅ Dashboard initialized", { 
        isAuthenticated, 
        userRole, 
        profileRole: profile?.role,
        isPharmacist: profile?.role === 'pharmacist',
        pathname: window.location.pathname,
        search: window.location.search
      });
    }
  }, [isAuthenticated, navigate, isLoading, userRole, profile]);
  
  // Force recalculation of chart dimensions when drawer state changes
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [isDrawerOpen]);

  // Prevent unnecessary re-renderings by memoizing the search params
  const paramsObj = Object.fromEntries(searchParams.entries());
  console.log("Dashboard rendering with params:", paramsObj);
  
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

  // Check authentication again for safety
  if (!isAuthenticated && !isLoading) {
    console.log("🔒 Dashboard - User not authenticated, waiting for redirect");
    return null;
  }

  // Activity drawer component - shared across all layouts
  const ActivityDrawer = () => (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed right-0 top-20 z-50"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
      >
        {isDrawerOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
      </Button>

      <div 
        className={`fixed inset-y-0 right-0 mt-16 w-[300px] border-l bg-white shadow-md transition-transform duration-300 z-40 overflow-hidden ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <Tabs 
            defaultValue="home" 
            className="w-full" 
            value={activeDrawerTab}
            onValueChange={setActiveDrawerTab}
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="home" className="mt-0">
              <Advertisements />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0">
              <ActivityFeed />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
  
  // Content with right drawer wrapper
  const WithRightDrawer = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-1 overflow-hidden relative">
      <main className={`flex-1 p-4 md:p-6 overflow-auto hover-scroll main-content-scroll transition-all duration-300 ${isDrawerOpen ? 'mr-[300px]' : 'mr-0'}`}>
        <ScrollArea className="h-full w-full">
          {children}
        </ScrollArea>
      </main>
      <ActivityDrawer />
    </div>
  );

  if (isAuthenticated && userRole) {
    console.log("🔓 Access granted to role:", userRole);
    
    // Always use PatientLayout for patient role
    if (userRole === "patient") {
      return (
        <RequireRoleGuard allowedRoles={["patient", "superadmin"]}>
          <CartProvider>
            <PatientLayout>
              <WithRightDrawer>
                <DashboardRouter userRole={userRole} />
              </WithRightDrawer>
            </PatientLayout>
          </CartProvider>
        </RequireRoleGuard>
      );
    } 
    // Use DoctorLayout for doctor role
    else if (userRole === "doctor") {
      return (
        <RequireRoleGuard allowedRoles={["doctor", "superadmin"]}>
          <CartProvider>
            <DoctorLayout>
              <WithRightDrawer>
                <DashboardRouter userRole={userRole} />
              </WithRightDrawer>
            </DoctorLayout>
          </CartProvider>
        </RequireRoleGuard>
      );
    } 
    // For other roles (pharmacist, superadmin), use the UnifiedLayoutTemplate
    else {
      return (
        <RequireRoleGuard allowedRoles={["patient", "doctor", "pharmacist", "superadmin"]}>
          <CartProvider>
            <UnifiedLayoutTemplate>
              <WithRightDrawer>
                <DashboardRouter userRole={userRole} />
              </WithRightDrawer>
            </UnifiedLayoutTemplate>
          </CartProvider>
        </RequireRoleGuard>
      );
    }
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

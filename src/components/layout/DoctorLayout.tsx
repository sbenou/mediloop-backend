
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import DoctorSidebar from "@/components/sidebar/DoctorSidebar";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Search, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout = ({ children }: DoctorLayoutProps) => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Only perform the check when loading is complete
    if (!isLoading) {
      console.log("DoctorLayout: Auth check - isAuthenticated:", isAuthenticated, "profile:", profile);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        if (!redirectAttempted.current) {
          console.log("DoctorLayout: User not authenticated, redirecting to login");
          redirectAttempted.current = true;
          navigate("/login", { replace: true });
        }
        return;
      }

      // Check if user has the doctor role, but only if profile exists
      if (isAuthenticated && profile && profile.role !== "doctor") {
        if (!redirectAttempted.current) {
          console.log("DoctorLayout: User is not a doctor, redirecting to dashboard");
          redirectAttempted.current = true;
          navigate("/dashboard", { replace: true });
        }
      }
    }

    // Handle window resize for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAuthenticated, isLoading, navigate, profile]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  // If not authenticated or not a doctor, don't render anything until redirect happens
  if (!isAuthenticated || (profile && profile.role !== "doctor")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DoctorSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="md:hidden absolute top-4 left-4 z-50">
          <Button variant="ghost" size="icon">
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <DoctorSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={cn(
          "bg-white shadow-sm h-16 flex items-center justify-end px-4 md:px-6",
          isMobile && "pl-16" // Add padding when mobile sidebar button is shown
        )}>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 text-sm rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 w-[200px] md:w-[300px]"
              />
            </div>
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto hover-scroll main-content-scroll">
          <ScrollArea className="h-full w-full">
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;

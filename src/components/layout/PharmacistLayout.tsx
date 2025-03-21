
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PharmacistSidebar from "@/components/sidebar/PharmacistSidebar";
import EnhancedUserMenu from "@/components/user-menu/EnhancedUserMenu";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface PharmacistLayoutProps {
  children: React.ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const { isAuthenticated, isLoading, profile, userRole } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const redirectAttempted = useRef(false);
  const sessionCheckAttempted = useRef(false);
  const layoutMounted = useRef(true);

  useEffect(() => {
    layoutMounted.current = true;
    
    // Handle window resize for mobile detection
    const handleResize = () => {
      if (layoutMounted.current) {
        setIsMobile(window.innerWidth < 768);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      layoutMounted.current = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // Verify session directly with Supabase to ensure we have a valid session
    const verifySession = async () => {
      if (sessionCheckAttempted.current || !layoutMounted.current) return;
      sessionCheckAttempted.current = true;
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          console.error("PharmacistLayout: Session verification failed:", error);
          if (layoutMounted.current) {
            setSessionCheckFailed(true);
          }
          return;
        }
        
        // Verify user role directly from the database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileError || !profileData) {
          console.error("PharmacistLayout: Failed to verify user role:", profileError);
          if (layoutMounted.current) {
            setSessionCheckFailed(true);
          }
          return;
        }
        
        if (profileData.role !== 'pharmacist') {
          console.log("PharmacistLayout: User is not a pharmacist, confirmed from database");
          if (!redirectAttempted.current && layoutMounted.current) {
            redirectAttempted.current = true;
            navigate("/dashboard", { replace: true });
          }
          return;
        }
        
        console.log("PharmacistLayout: Session and role verification successful");
        if (layoutMounted.current) {
          setSessionCheckFailed(false);
        }
      } catch (error) {
        console.error("PharmacistLayout: Session check error:", error);
        if (layoutMounted.current) {
          setSessionCheckFailed(true);
        }
      }
    };
    
    if (!isLoading && isAuthenticated && layoutMounted.current) {
      verifySession();
    }
    
    return () => {
      layoutMounted.current = false;
    };
  }, [isAuthenticated, isLoading, navigate]);
  
  useEffect(() => {
    // Only perform the check when loading is complete and not during initial load
    if (!isLoading && layoutMounted.current) {
      console.log("PharmacistLayout: Auth check - isAuthenticated:", isAuthenticated, "profile:", profile, "userRole:", userRole);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        if (!redirectAttempted.current && layoutMounted.current) {
          console.log("PharmacistLayout: User not authenticated, redirecting to login");
          redirectAttempted.current = true;
          navigate("/login", { replace: true });
        }
        return;
      }

      // Check if user has the pharmacist role, but only if profile exists
      if (isAuthenticated && profile && profile.role !== "pharmacist") {
        if (!redirectAttempted.current && layoutMounted.current) {
          console.log("PharmacistLayout: User is not a pharmacist, redirecting to dashboard");
          redirectAttempted.current = true;
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate, profile, userRole]);

  // Handle session recovery
  const handleRetrySession = async () => {
    try {
      toast({
        title: "Reconnecting...",
        description: "Attempting to reconnect your session",
      });
      
      // Force sign out first to clear any bad state
      await supabase.auth.signOut({ scope: 'local' });
      
      // Redirect to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error during session recovery:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not recover your session. Please try again.",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If session check failed, show recovery option
  if (sessionCheckFailed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold">Session Error</h2>
          <p className="text-muted-foreground mb-4">
            There was a problem with your session. This could be due to an expired token or network issue.
          </p>
          <Button onClick={handleRetrySession}>
            Reconnect Session
          </Button>
        </div>
      </div>
    );
  }

  // If not authenticated or not a pharmacist, show minimal loading until redirect happens
  if (!isAuthenticated || (profile && profile.role !== "pharmacist")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <PharmacistSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="md:hidden absolute top-4 left-4 z-50">
          <Button variant="ghost" size="icon">
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <PharmacistSidebar />
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
            <EnhancedUserMenu />
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

export default PharmacistLayout;

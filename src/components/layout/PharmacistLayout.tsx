
import { useState, useEffect } from "react";
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
import Header from "@/components/layout/Header";
import UserMenu from "@/components/UserMenu";

interface PharmacistLayoutProps {
  children: React.ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);

  useEffect(() => {
    // Verify session directly with Supabase to ensure we have a valid session
    const verifySession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          console.error("PharmacistLayout: Session verification failed:", error);
          setSessionCheckFailed(true);
          return;
        }
        
        console.log("PharmacistLayout: Session verification successful");
        setSessionCheckFailed(false);
      } catch (error) {
        console.error("PharmacistLayout: Session check error:", error);
        setSessionCheckFailed(true);
      }
    };
    
    verifySession();
  }, []);

  useEffect(() => {
    // Handle window resize for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during session recovery:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not recover your session. Please try again.",
      });
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <Header showBackLink={false} />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <PharmacistSidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild className="md:hidden absolute top-20 left-4 z-50">
            <Button variant="ghost" size="icon">
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] mt-16">
            <PharmacistSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Secondary content header */}
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
    </div>
  );
};

export default PharmacistLayout;

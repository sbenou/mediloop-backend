
import { useState, useEffect } from "react";
import PharmacistSidebar from "@/components/sidebar/PharmacistSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import UnifiedHeader from "./UnifiedHeader";

interface PharmacistLayoutProps {
  children: React.ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div className="flex flex-1">
        {/* Always use PharmacistSidebar for desktop sidebar */}
        <div className="hidden md:block">
          <PharmacistSidebar />
        </div>

        {/* Mobile Sidebar using the same PharmacistSidebar component */}
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
          <UnifiedHeader />
          
          {/* Main content area */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PharmacistLayout;

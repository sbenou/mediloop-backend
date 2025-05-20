
import { useState, useEffect } from "react";
import PharmacistSidebar from "@/components/sidebar/PharmacistSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, AlertTriangle, SidebarClose, SidebarOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import UnifiedHeader from "./UnifiedHeader";
import { useLocation } from "react-router-dom";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PharmacistLayoutProps {
  children: React.ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const location = useLocation();
  const { state } = location;

  // Activity drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");

  // Determine if sidebar should be shown based on location state
  const showSidebar = state?.keepSidebar !== false; // Default to showing sidebar unless explicitly set to false

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

  // Force recalculation of chart dimensions when drawer state changes
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [isDrawerOpen]);

  // Log current location to help with debugging
  useEffect(() => {
    console.log("PharmacistLayout: Current location:", location.pathname, location.search);
  }, [location]);

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
        {/* Always use PharmacistSidebar for desktop sidebar - never hide it */}
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
          
          {/* Main content area with right drawer */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Main content */}
            <main className={`flex-1 p-4 md:p-6 overflow-auto hover-scroll main-content-scroll transition-all duration-300 ${isDrawerOpen ? 'mr-[300px]' : 'mr-0'}`}>
              {children}
            </main>
            
            {/* Drawer toggle button */}
            <Button
              variant="outline"
              size="icon"
              className="fixed right-0 top-20 z-50"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            >
              {isDrawerOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
            </Button>
            
            {/* Right drawer */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistLayout;

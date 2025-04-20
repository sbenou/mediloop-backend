
import { useState, useEffect } from "react";
import DoctorSidebar from "@/components/sidebar/DoctorSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X, SidebarClose, SidebarOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnifiedHeader from "./UnifiedHeader";

interface DoctorLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

const DoctorLayout = ({ children, hideHeader = false }: DoctorLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <DoctorSidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild className="md:hidden absolute top-20 left-4 z-50">
            <Button variant="ghost" size="icon">
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] mt-16">
            <DoctorSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Unified header with stable key to prevent re-renders */}
          {!hideHeader && <UnifiedHeader key="unified-header-doctor" />}
          {/* Main Content with Right Drawer */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Main content area */}
            <main className={`flex-1 p-4 md:p-6 overflow-auto hover-scroll main-content-scroll transition-all duration-300 ${isDrawerOpen ? 'mr-[300px]' : 'mr-0'}`}>
              <ScrollArea className="h-full w-full">
                {children}
              </ScrollArea>
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

export default DoctorLayout;

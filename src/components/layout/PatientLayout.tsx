
import React, { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../sidebar/PatientSidebar";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnifiedHeader from "./UnifiedHeader";

interface PatientLayoutProps {
  children: ReactNode;
  hideHeader?: boolean; // Add hideHeader prop
}

const PatientLayout = ({ children, hideHeader = false }: PatientLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");
  const navigate = useNavigate();
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left section - Sidebar */}
      <aside className="w-64 h-full shrink-0 border-r">
        <PatientSidebar />
      </aside>
      
      {/* Right section - Contains header and content area with right panel */}
      <div className="flex flex-col flex-1">
        {/* Header spans the entire width of this section */}
        {!hideHeader && <UnifiedHeader />}
        
        {/* Main content wrapper */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Main content area */}
          <main className={`flex-1 p-6 h-full overflow-auto transition-all duration-300 ${isDrawerOpen ? 'mr-[300px]' : 'mr-0'}`}>
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
  );
};

export default PatientLayout;

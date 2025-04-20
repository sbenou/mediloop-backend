
import React, { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import RoleDebugger from "@/components/user-menu/RoleDebugger";
import { CartProvider } from "@/providers/CartProvider";
import UnifiedHeader from "./UnifiedHeader";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UnifiedLayoutTemplateProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

const UnifiedLayoutTemplate: React.FC<UnifiedLayoutTemplateProps> = ({ 
  children,
  hideHeader = false 
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");

  return (
    <CartProvider>
      <div className="flex min-h-screen bg-background">
        <RoleDebugger />
        <Sidebar />
        <div className="flex flex-col flex-1">
          {!hideHeader && <UnifiedHeader />}
          
          <div className="flex flex-1 overflow-hidden relative">
            {/* Main content area */}
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
    </CartProvider>
  );
};

export default UnifiedLayoutTemplate;

import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import NotificationBell from "../NotificationBell";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MainNavigation } from "./navigation/MainNavigation";
import CartButton from "./navigation/CartButton";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { mockActivities } from "@/components/activity/mockActivities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import EnhancedUserMenu from "../user-menu/EnhancedUserMenu";
import { useAuth } from "@/hooks/auth/useAuth";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayoutTemplate = ({ children }: UnifiedLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activities, setActivities] = useState(mockActivities);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleMarkRead = (id: string) => {
    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === id ? { ...activity, read: true } : activity
      )
    );
    toast({
      title: "Activity marked as read",
      duration: 2000,
    });
  };

  const handleMarkAllRead = () => {
    setActivities(prevActivities => 
      prevActivities.map(activity => ({ ...activity, read: true }))
    );
    toast({
      title: "All activities marked as read",
      duration: 2000,
    });
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - Always show for unified layout */}
      <UnifiedSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Apply a consistent font family to header */}
        <header className="h-16 border-b px-6 flex items-center justify-between font-sans">
          <div className="flex items-center space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                <MainNavigation />
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <CartButton isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
            {isAuthenticated ? (
              <EnhancedUserMenu />
            ) : (
              <Button variant="outline" onClick={() => navigate('/login')}>
                Login
              </Button>
            )}
          </div>
        </header>
        
        {/* Main content with right drawer */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Main content area */}
          <main 
            className={`flex-1 p-6 h-full transition-all duration-300 ${isDrawerOpen ? 'mr-[300px]' : 'mr-0'}`}
          >
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
                  <ActivityFeed 
                    activities={activities}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLayoutTemplate;

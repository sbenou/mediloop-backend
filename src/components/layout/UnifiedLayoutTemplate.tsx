
import { ReactNode } from "react";
import Sidebar from "../sidebar/Sidebar";
import NotificationBell from "../NotificationBell";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MainNavigation } from "./navigation/MainNavigation";
import CartButton from "./navigation/CartButton";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import UserMenu from "@/components/UserMenu";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayoutTemplate = ({ children }: UnifiedLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");
  const { userRole } = useAuth();
  
  console.log("UnifiedLayoutTemplate rendering for role:", userRole);
  
  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="flex h-screen w-full overflow-hidden">
          {/* Dynamic Sidebar based on user role */}
          <Sidebar />
          
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
                <div className="text-xs text-muted-foreground">
                  <span>Role: {userRole || "Not logged in"}</span>
                </div>
                <NotificationBell />
                <CartButton isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
                <UserMenu />
              </div>
            </header>
            
            {/* Main content with right drawer */}
            <div className="flex flex-1 overflow-hidden relative">
              {/* Main content area */}
              <main 
                className={`flex-1 p-6 h-full transition-all duration-300 ${isDrawerOpen ? 'mr-[300px]' : 'mr-0'}`}
              >
                {children || (
                  <div className="p-4 border border-red-300 rounded bg-red-50 text-red-700">
                    ⚠️ No content rendered in main layout. Check dashboard router.
                  </div>
                )}
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
                      {typeof Advertisements === 'function' ? (
                        <Advertisements />
                      ) : (
                        <div className="p-4 border rounded text-amber-700 bg-amber-50">
                          Advertisements component failed to load
                        </div>
                      )}
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
    </CurrencyProvider>
  );
};

export default UnifiedLayoutTemplate;

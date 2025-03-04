
import { ReactNode, useState } from "react";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import NotificationBell from "../NotificationBell";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MainNavigation } from "./navigation/MainNavigation";
import CartButton from "./navigation/CartButton";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayoutTemplate = ({ children }: UnifiedLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
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
            <div className="flex items-center space-x-2">
              <button className="text-primary hover:text-primary/80 transition-colors">
                Connection
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayoutTemplate;

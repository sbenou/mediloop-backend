
import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import DashboardSidebar from "../sidebar/DashboardSidebar";
import NotificationBell from "../NotificationBell";
import UserMenu from "../UserMenu";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MainNavigation } from "./navigation/MainNavigation";
import CartButton from "./navigation/CartButton";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  const { isAuthenticated } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - Always show for unified layout */}
      <DashboardSidebar />
      
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
            <UserMenu />
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

export default UnifiedLayout;

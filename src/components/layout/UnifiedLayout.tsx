
import { ReactNode } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import NotificationBell from "../NotificationBell";
import UserMenu from "../UserMenu";
import { ShoppingCart, Bell } from "lucide-react";
import { MainNavigation } from "./navigation/MainNavigation";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  const { isAuthenticated } = useAuth();
  
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
            <button className="relative p-2 text-primary hover:text-primary/80 transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </button>
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

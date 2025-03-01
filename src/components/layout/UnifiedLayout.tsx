
import { ReactNode, useState } from "react";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import NotificationBell from "../NotificationBell";
import CartButton from "./navigation/CartButton";
import UserMenu from "../UserMenu";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "../ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { userRole, isAuthenticated } = useAuth();
  
  // Determine if we should show cart (only for patients)
  const showCart = userRole === "patient" || !userRole;
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left section - Sidebar */}
        <UnifiedSidebar />
        
        {/* Right section - Contains header and content area with right panel */}
        <div className="flex flex-col flex-1">
          {/* Header spans the entire width of this section */}
          <header className="h-16 border-b px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">MedConnect</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {showCart && (
                <CartButton 
                  isOpen={isCartOpen} 
                  onOpenChange={setIsCartOpen} 
                />
              )}
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Button variant="outline" size="sm">Log in</Button>
              )}
            </div>
          </header>
          
          {/* Main content wrapper */}
          <div className="flex flex-1 overflow-hidden">
            {/* Main content area */}
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
            
            {/* Right panel */}
            <aside className="w-64 shrink-0 border-l h-full bg-background p-4 hidden md:block">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Quick Links</h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    My Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    My Prescriptions
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    My Orders
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UnifiedLayout;


import { ReactNode, useState } from "react";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import NotificationBell from "../NotificationBell";
import CartButton from "./navigation/CartButton";
import { useAuth } from "@/hooks/auth/useAuth";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { userRole } = useAuth();
  
  // Determine if we should show cart (only for patients)
  const showCart = userRole === "patient" || !userRole;
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Make sidebar full height */}
      <UnifiedSidebar />
      
      {/* Right section - Contains header and content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header spans the entire width of this section */}
        <header className="h-16 border-b px-6 flex items-center justify-end space-x-4">
          <NotificationBell />
          {showCart && (
            <CartButton 
              isOpen={isCartOpen} 
              onOpenChange={setIsCartOpen} 
            />
          )}
        </header>
        
        {/* Main content wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content area */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLayout;

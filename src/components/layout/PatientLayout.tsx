
import { ReactNode, useState } from "react";
import PatientSidebar from "../sidebar/PatientSidebar";
import EnhancedUserMenu from "../user-menu/EnhancedUserMenu";
import NotificationBell from "../NotificationBell";
import CartButton from "./navigation/CartButton";

interface PatientLayoutProps {
  children: ReactNode;
}

const PatientLayout = ({ children }: PatientLayoutProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left section - Sidebar */}
      <aside className="w-64 h-full shrink-0 border-r">
        <PatientSidebar />
      </aside>
      
      {/* Right section - Contains header and content area with right panel */}
      <div className="flex flex-col flex-1">
        {/* Header spans the entire width of this section */}
        <header className="h-16 border-b px-6 flex items-center justify-end space-x-4">
          <NotificationBell />
          <CartButton 
            isOpen={isCartOpen} 
            onOpenChange={setIsCartOpen} 
          />
          <EnhancedUserMenu />
        </header>
        
        {/* Main content wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content area */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
          
          {/* Right panel */}
          <aside className="w-64 shrink-0 border-l h-full bg-background">
            {/* Panel content will go here */}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PatientLayout;

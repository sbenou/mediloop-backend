
import { ReactNode } from "react";
import PatientSidebar from "../sidebar/PatientSidebar";
import EnhancedUserMenu from "../user-menu/EnhancedUserMenu";
import NotificationBell from "../NotificationBell";
import CartButton from "./navigation/CartButton";

interface PatientLayoutProps {
  children: ReactNode;
}

const PatientLayout = ({ children }: PatientLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left section - Sidebar */}
      <div className="w-64 shrink-0">
        <PatientSidebar />
      </div>
      
      {/* Mid section - Contains main content area and right panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar - spans the entire mid section */}
        <header className="border-b h-16 px-6 flex items-center justify-end space-x-4">
          <NotificationBell />
          <CartButton isOpen={false} onOpenChange={() => {}} />
          <EnhancedUserMenu />
        </header>
        
        {/* Content area - split into main content and right panel */}
        <div className="flex flex-1">
          {/* Main content */}
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
          
          {/* Right panel - Same width as sidebar */}
          <div className="w-64 shrink-0 bg-gray-50">
            {/* This space will be filled with additional content later */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLayout;


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
      
      {/* Content wrapper - Contains both main content and right panel */}
      <div className="flex flex-1">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top bar - spans both main content and right panel */}
          <header className="border-b h-16 px-6 flex items-center justify-end space-x-4 absolute right-0 top-0 w-[calc(100%-16rem)]">
            <NotificationBell />
            <CartButton isOpen={false} onOpenChange={() => {}} />
            <EnhancedUserMenu />
          </header>
          
          {/* Main content */}
          <main className="p-6 overflow-auto flex-grow mt-16">
            {children}
          </main>
        </div>
        
        {/* Right panel - Same width as sidebar */}
        <div className="w-64 shrink-0 bg-gray-50">
          {/* This space will be filled with additional content later */}
        </div>
      </div>
    </div>
  );
};

export default PatientLayout;

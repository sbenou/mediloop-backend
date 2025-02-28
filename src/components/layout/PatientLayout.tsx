
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
      
      {/* Middle section - Currently empty but will contain content from sidebar links */}
      <div className="flex-1 border-r">
        <div className="min-h-screen bg-gray-50">
          {/* This space will be filled by content from sidebar navigation */}
        </div>
      </div>
      
      {/* Right section - Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="border-b h-16 px-6 flex items-center justify-end space-x-4">
          <NotificationBell />
          <CartButton isOpen={false} onOpenChange={() => {}} />
          <EnhancedUserMenu />
        </header>
        
        {/* Main content */}
        <main className="p-6 overflow-auto flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;


import React, { ReactNode } from "react";
import PatientSidebar from "../sidebar/PatientSidebar";
import UnifiedHeader from "./UnifiedHeader";

interface PatientLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

const PatientLayout = ({ children, hideHeader = false }: PatientLayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left section - Sidebar */}
      <aside className="w-64 h-full shrink-0 border-r">
        <PatientSidebar />
      </aside>
      
      {/* Right section - Contains header and content area */}
      <div className="flex flex-col flex-1">
        {/* Header spans the entire width of this section */}
        {!hideHeader && <UnifiedHeader />}
        
        {/* Main content area */}
        <main className="flex-1 p-6 h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;

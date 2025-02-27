
import { ReactNode } from "react";
import PatientSidebar from "../sidebar/PatientSidebar";
import EnhancedUserMenu from "../user-menu/EnhancedUserMenu";

interface PatientLayoutProps {
  children: ReactNode;
}

const PatientLayout = ({ children }: PatientLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full">
      <PatientSidebar />
      <div className="flex-1">
        <header className="border-b h-16 px-6 flex items-center justify-end">
          <EnhancedUserMenu />
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;

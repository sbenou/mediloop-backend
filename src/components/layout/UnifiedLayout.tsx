
import { ReactNode } from "react";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        {isAuthenticated && <UnifiedSidebar />}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">MedConnect</h1>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UnifiedLayout;

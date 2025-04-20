
import React from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import RoleDebugger from "@/components/user-menu/RoleDebugger";
import { CartProvider } from "@/providers/CartProvider";
import UnifiedHeader from "./UnifiedHeader";

interface UnifiedLayoutTemplateProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

const UnifiedLayoutTemplate: React.FC<UnifiedLayoutTemplateProps> = ({ 
  children,
  hideHeader = false 
}) => {
  return (
    <CartProvider>
      <div className="flex min-h-screen bg-background">
        <RoleDebugger />
        <Sidebar />
        <div className="flex flex-col flex-1">
          {!hideHeader && <UnifiedHeader key="unified-header-template" />}
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  );
};

export default UnifiedLayoutTemplate;


import React from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/layout/Header";
import RoleDebugger from "@/components/user-menu/RoleDebugger";
import { CartProvider } from "@/providers/CartProvider";

interface UnifiedLayoutTemplateProps {
  children: React.ReactNode;
}

const UnifiedLayoutTemplate: React.FC<UnifiedLayoutTemplateProps> = ({ children }) => {
  return (
    <CartProvider>
      <div className="flex min-h-screen bg-background">
        <RoleDebugger />
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  );
};

export default UnifiedLayoutTemplate;

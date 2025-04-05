
import React, { ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Sidebar from "../sidebar/Sidebar";

interface DoctorLayoutProps {
  children: ReactNode;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children }) => {
  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </CartProvider>
    </CurrencyProvider>
  );
};

export default DoctorLayout;

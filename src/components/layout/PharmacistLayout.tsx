
import React, { ReactNode } from "react";
import PharmacistSidebar from "../sidebar/PharmacistSidebar";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

interface PharmacistLayoutProps {
  children: ReactNode;
}

const PharmacistLayout: React.FC<PharmacistLayoutProps> = ({ children }) => {
  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="flex min-h-screen">
          <PharmacistSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </CartProvider>
    </CurrencyProvider>
  );
};

export default PharmacistLayout;

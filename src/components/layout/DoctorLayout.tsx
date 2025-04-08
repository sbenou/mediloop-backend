
import { ReactNode } from "react";
import { UserMenu } from "@/components/ui";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/toaster";

interface DoctorLayoutProps {
  children: ReactNode;
}

const DoctorLayout = ({ children }: DoctorLayoutProps) => {
  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="flex h-screen overflow-hidden">
          <UnifiedSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </div>
        <Toaster />
      </CartProvider>
    </CurrencyProvider>
  );
};

export default DoctorLayout;

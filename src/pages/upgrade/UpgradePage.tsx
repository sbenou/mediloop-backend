
import React from "react";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlansTab } from "@/components/upgrade/PlansTab";
import { BoostsTab } from "@/components/upgrade/BoostsTab";
import { useAuth } from "@/hooks/auth/useAuth";

const UpgradePage = () => {
  const { profile } = useAuth();
  const isProfessional = profile?.role === 'doctor' || profile?.role === 'pharmacist';

  return (
    <CurrencyProvider>
      <CartProvider>
        <UnifiedLayoutTemplate>
          <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Upgrade</h1>
            <p className="text-muted-foreground mb-8">
              Choose the plan that best fits your needs
            </p>
            
            <Tabs defaultValue="plans">
              <TabsList className="mb-8">
                <TabsTrigger value="plans">Plans</TabsTrigger>
                {isProfessional && <TabsTrigger value="boosts">Boosts</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="plans">
                <PlansTab />
              </TabsContent>
              
              {isProfessional && (
                <TabsContent value="boosts">
                  <BoostsTab />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </UnifiedLayoutTemplate>
      </CartProvider>
    </CurrencyProvider>
  );
};

export default UpgradePage;

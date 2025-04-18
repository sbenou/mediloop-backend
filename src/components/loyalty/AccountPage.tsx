
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoyaltyHeader } from "@/components/loyalty/LoyaltyHeader";
import { WalletSection } from "@/components/loyalty/WalletSection";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { useAuth } from "@/hooks/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Gift, Truck, Award, Stethoscope, FlaskConical } from "lucide-react";

interface AccountPageProps {
  showHeader?: boolean;
}

const AccountPage = ({ showHeader = true }: AccountPageProps) => {
  const { profile } = useAuth();
  const loyalty = useLoyaltyStatus();

  // Get role-specific benefits
  const getRoleBenefits = () => {
    switch (profile?.role) {
      case 'doctor':
        return [
          {
            name: "Priority support",
            value: "24/7 access",
            icon: <Stethoscope className="h-4 w-4 text-blue-500" />
          },
          {
            name: "Professional development",
            value: `${loyalty.professionalCredits || 0} credits`,
            icon: <Award className="h-4 w-4 text-blue-500" />
          }
        ];
      case 'pharmacist':
        return [
          {
            name: "Discount on platform fees",
            value: `${loyalty.discountRate || 0}%`,
            icon: <FlaskConical className="h-4 w-4 text-green-500" />
          },
          {
            name: "Marketing credits",
            value: `€${loyalty.marketingCredits || 0}`,
            icon: <Gift className="h-4 w-4 text-green-500" />
          }
        ];
      default: // patient
        return [
          {
            name: "Available free deliveries",
            value: loyalty.freeDeliveries || 0,
            icon: <Truck className="h-4 w-4 text-indigo-500" />
          },
          {
            name: "Health rewards",
            value: `${loyalty.healthRewards || 0} points`,
            icon: <Gift className="h-4 w-4 text-indigo-500" />
          }
        ];
    }
  };

  const benefits = getRoleBenefits();
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">My Account</h1>
      
      <Tabs defaultValue="loyalty" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="loyalty">
          <div className="space-y-6">
            <LoyaltyHeader />
            
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Program Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="flex items-center gap-2">
                        {benefit.icon}
                        {benefit.name}:
                      </span>
                      <span className="font-medium">{benefit.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span>Wallet balance:</span>
                    <span className="font-medium">€{loyalty.walletBalance.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallet">
          <WalletSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountPage;

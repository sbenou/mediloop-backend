
import React from "react";
import { LoyaltyHeader } from "@/components/loyalty/LoyaltyHeader";
import { ReferralTimeline } from "@/components/loyalty/ReferralTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountPageProps {
  showHeader?: boolean;
}

const AccountPage = ({ showHeader = true }: AccountPageProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">My Account</h1>
      
      <Tabs defaultValue="loyalty" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="referral">Referral History</TabsTrigger>
        </TabsList>

        <TabsContent value="loyalty">
          <div className="space-y-6">
            <LoyaltyHeader />
            
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Program Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span>Next level threshold:</span>
                    <span className="font-medium">1000 points</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span>Available free deliveries:</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Wallet balance:</span>
                    <span className="font-medium">€10.50</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referral">
          <ReferralTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountPage;

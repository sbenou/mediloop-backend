
import React from "react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const BillingDetails = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Billing Details</h1>
        <p className="text-muted-foreground mb-8">
          Manage your subscription and view your payment history
        </p>
        
        <Tabs defaultValue="subscription" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="transport">Transport Fees</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the Free plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">Free Plan</h3>
                  <p className="text-muted-foreground">Basic access to the platform</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span>Basic prescriptions</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span>Limited teleconsultations</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <span>Priority support</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => window.location.href = '/upgrade'}>Upgrade to Pro</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View your recent payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  No payment history available
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transport Fees</CardTitle>
                <CardDescription>
                  View your transport fee payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  No transport fee history available
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default BillingDetails;

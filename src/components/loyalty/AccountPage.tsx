
import React from "react";
import Header from "@/components/layout/Header";
import { LoyaltyHeader } from "@/components/loyalty/LoyaltyHeader";
import { ReferralTimeline } from "@/components/loyalty/ReferralTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AccountPage = () => {
  return (
    <div>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <LoyaltyHeader />
          <ReferralTimeline />
        </div>

        <Tabs defaultValue="loyalty" className="space-y-4">
          <TabsList>
            <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
            <TabsTrigger value="referral">Referral History</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="loyalty">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Loyalty Program Details</h2>
              <p className="text-muted-foreground mb-4">
                Earn points with every purchase and interaction with our platform. Points can be redeemed for discounts, 
                free deliveries, or special offers.
              </p>
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
            </div>
          </TabsContent>

          <TabsContent value="referral">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Refer Friends & Earn Points</h2>
              <p className="text-muted-foreground mb-4">
                Share your referral link with friends and family. When they join and make their first purchase, 
                you'll both earn loyalty points!
              </p>
              <div className="relative mb-6">
                <input
                  type="text"
                  value="https://mediloop.app/refer?code=USER123"
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  readOnly
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-primary px-2 py-1 text-xs text-white">
                  Copy
                </button>
              </div>
              <ReferralTimeline />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Notifications</label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="orderUpdates" className="rounded border-gray-300" defaultChecked />
                    <label htmlFor="orderUpdates">Order updates</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="promotions" className="rounded border-gray-300" defaultChecked />
                    <label htmlFor="promotions">Promotions and news</label>
                  </div>
                </div>
                <div>
                  <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountPage;

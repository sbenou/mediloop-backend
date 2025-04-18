
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { WalletBalance } from "./wallet/WalletBalance";
import { PointConversion } from "./wallet/PointConversion";
import { WalletSettings } from "./wallet/WalletSettings";

export function WalletSection() {
  return (
    <div className="space-y-6">
      <WalletBalance />
      <PointConversion />
      <WalletSettings />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wallet">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>No wallet transactions found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet } from "lucide-react";

export function WalletSection() {
  const loyalty = useLoyaltyStatus();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Wallet Balance</CardTitle>
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold">€{loyalty.walletBalance.toFixed(2)}</p>
            </div>
            
            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <span>Available Points</span>
              <span className="font-medium">{loyalty.availablePoints}</span>
            </div>
            
            <Button className="w-full">
              Convert Points to Wallet Credit <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

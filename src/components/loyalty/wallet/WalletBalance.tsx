
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";

export function WalletBalance() {
  const loyalty = useLoyaltyStatus();

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-xl font-semibold">Wallet Balance</h2>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground">Available Points</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loyalty.availablePoints}</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground">Wallet Balance</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{loyalty.walletBalance.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

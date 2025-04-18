
import React, { useState } from "react";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowRightLeft, CreditCard, History } from "lucide-react";

export function WalletSection() {
  const [pointsToConvert, setPointsToConvert] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const loyalty = useLoyaltyStatus();

  const handlePointConversion = async () => {
    if (pointsToConvert <= 0) {
      toast.error("Please enter a valid number of points to convert");
      return;
    }

    if (pointsToConvert > loyalty.availablePoints) {
      toast.error("You don't have enough points to convert");
      return;
    }

    setIsConverting(true);

    try {
      // Simulate API call for point conversion
      // In a real app, this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success(`Successfully converted ${pointsToConvert} points to €${(pointsToConvert / 100).toFixed(2)}`);
      setPointsToConvert(0);
      // In a real app, we would refresh the loyalty status here
    } catch (error) {
      console.error("Error converting points:", error);
      toast.error("Failed to convert points. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const hasConvertedFunds = loyalty.walletBalance > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Wallet Balance</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Convert Points to Money</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Convert your loyalty points to wallet funds at a rate of 100 points = €1.00.
          </p>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="points" className="block text-sm font-medium mb-1">
                Points to Convert
              </label>
              <Input
                id="points"
                type="number"
                min="0"
                max={loyalty.availablePoints}
                value={pointsToConvert || ""}
                onChange={(e) => setPointsToConvert(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="text-center md:text-left py-2 md:pb-0">
              <ArrowRightLeft className="mx-auto md:mx-0" />
            </div>
            <div className="flex-1">
              <label htmlFor="money" className="block text-sm font-medium mb-1">
                Wallet Amount
              </label>
              <Input
                id="money"
                type="text"
                value={`€${(pointsToConvert / 100).toFixed(2)}`}
                disabled
                className="w-full bg-muted"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handlePointConversion} 
            disabled={isConverting || pointsToConvert <= 0 || pointsToConvert > loyalty.availablePoints}
            className="w-full"
          >
            {isConverting ? "Converting..." : "Convert Points"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Use Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use your wallet balance for your next subscription payment or other purchases.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full" 
            disabled={!hasConvertedFunds}
            variant="outline"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Use for next subscription payment
          </Button>
          <Button 
            variant="secondary" 
            className="w-full"
          >
            <History className="mr-2 h-4 w-4" />
            View Transaction History
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              {/* This would be populated with real transaction data */}
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wallet">
          <Card>
            <CardContent className="pt-6">
              {/* This would be populated with real wallet transaction data */}
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

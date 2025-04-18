
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditCard, History } from "lucide-react";
import { toast } from "sonner";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";

export function WalletSettings() {
  const [useForSubscription, setUseForSubscription] = React.useState(false);
  const loyalty = useLoyaltyStatus();
  const hasConvertedFunds = loyalty.walletBalance > 0;

  const toggleUseForSubscription = () => {
    const newValue = !useForSubscription;
    setUseForSubscription(newValue);
    
    if (newValue) {
      toast.success("Wallet balance will be used for your next subscription payment");
    } else {
      toast.info("Wallet balance will not be used for subscription payments");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Use Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Use your wallet balance for your next subscription payment or other purchases.
        </p>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Use for next subscription payment</span>
          </div>
          <Switch
            checked={useForSubscription}
            onCheckedChange={toggleUseForSubscription}
            disabled={!hasConvertedFunds}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          variant="secondary" 
          className="w-full"
        >
          <History className="mr-2 h-4 w-4" />
          View Transaction History
        </Button>
      </CardFooter>
    </Card>
  );
}

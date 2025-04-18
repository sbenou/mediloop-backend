
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";

export function PointConversion() {
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Successfully converted ${pointsToConvert} points to €${(pointsToConvert / 100).toFixed(2)}`);
      setPointsToConvert(0);
    } catch (error) {
      console.error("Error converting points:", error);
      toast.error("Failed to convert points. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newValue = pointsToConvert + change;
    if (newValue >= 0 && newValue <= loyalty.availablePoints) {
      setPointsToConvert(newValue);
    }
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0 && value <= loyalty.availablePoints) {
      setPointsToConvert(value);
    }
  };

  return (
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
            <div className="flex items-center w-full h-10 border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(-100)}
                disabled={pointsToConvert <= 0}
                className="h-full"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="points"
                type="number"
                min="0"
                max={loyalty.availablePoints}
                value={pointsToConvert || ""}
                onChange={handleDirectInput}
                className="h-full border-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(100)}
                disabled={pointsToConvert >= loyalty.availablePoints}
                className="h-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
  );
}

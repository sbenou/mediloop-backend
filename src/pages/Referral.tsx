
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const Referral = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading || !profile?.id) {
    return null;
  }

  return (
    <UnifiedLayoutTemplate>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          <h1 className="text-3xl font-bold mb-8">Referral Program</h1>
          <Card>
            <CardHeader>
              <CardTitle>Refer Friends & Earn Points</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Referral;

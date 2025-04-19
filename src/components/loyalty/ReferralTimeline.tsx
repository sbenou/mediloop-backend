
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Shield, Clock, Award, Crown, Medal } from "lucide-react";
import { SeniorityBadges } from "./SeniorityBadges";

export function ReferralTimeline() {
  const loyalty = useLoyaltyStatus();
  
  return (
    <div className="space-y-6">
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
            
            {loyalty.nextBadgeYears !== null && (
              <div className="flex justify-between items-center border-b pb-2">
                <span>Next seniority badge:</span>
                <span className="font-medium">
                  In {loyalty.nextBadgeYears} {loyalty.nextBadgeYears === 1 ? 'year' : 'years'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <SeniorityBadges />
    </div>
  );
}

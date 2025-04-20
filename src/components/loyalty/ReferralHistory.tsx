
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReferralHistory } from "@/hooks/loyalty/useReferralHistory";
import { Mail, CheckCircle, Clock } from "lucide-react";

export function ReferralHistory() {
  const { referrals, isLoading } = useReferralHistory();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Referral History...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  if (!referrals.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-muted-foreground">
            <p>You haven't made any referrals yet</p>
            <p className="text-sm mt-2">Refer friends to earn loyalty points!</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrals.map((referral) => (
            <div key={referral.id} className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center">
                <div className="bg-primary/10 rounded-full p-2 mr-3">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{referral.referral_email}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div>
                {referral.status === 'converted' ? (
                  <Badge className="flex items-center bg-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" /> Joined
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" /> Pending
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

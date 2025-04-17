
import { Clock, ArrowRight, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReferralHistory } from "@/hooks/loyalty/useReferralHistory";
import { format } from "date-fns";

export function ReferralTimeline() {
  const { referrals } = useReferralHistory();

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {referrals.map((referral) => (
            <div key={referral.id} className="flex items-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                <Clock className="h-4 w-4" />
              </div>
              <div className="ml-4 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">
                    {referral.referral_email}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="flex items-center gap-1">
                    {referral.status === 'converted' ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-500">+{referral.points_awarded} points</span>
                      </>
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(referral.created_at), 'PPP')}
                </p>
                {referral.converted_at && (
                  <p className="text-xs text-muted-foreground">
                    Converted: {format(new Date(referral.converted_at), 'PPP')}
                  </p>
                )}
              </div>
            </div>
          ))}
          {referrals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No referrals yet. Invite friends to earn points!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

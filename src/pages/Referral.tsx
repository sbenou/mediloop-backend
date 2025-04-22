import React, { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralTimeline } from "@/components/loyalty/ReferralTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Referral = () => {
  const { profile, isLoading } = useAuth();
  const [emails, setEmails] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");

  if (isLoading || !profile?.id) {
    return null;
  }

  const handleSendReferrals = async () => {
    const emailList = emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    setIsSending(true);
    setSendStatus("idle");

    try {
      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Use proper method to get the URL without accessing protected property
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hrrlefgnhkbzuwyklejj.supabase.co';
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-referral-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Don't include Authorization header as we've disabled JWT verification
          },
          body: JSON.stringify({
            emails: emailList,
            referrer_name: profile.full_name || "A friend",
            referrer_id: profile.id,
            referral_code: `USER${profile.id.substring(0, 6).toUpperCase()}`,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send referral emails");

      toast.success(
        `Referral invitations sent to ${emailList.length} email${
          emailList.length > 1 ? "s" : ""
        }!`
      );
      setEmails("");
      setSendStatus("success");
    } catch (error) {
      console.error("Error sending referral emails:", error);
      toast.error("Failed to send referral emails. Please try again later.");
      setSendStatus("error");
    } finally {
      setIsSending(false);
      // Reset status after 3 seconds
      setTimeout(() => setSendStatus("idle"), 3000);
    }
  };

  const buttonContent = () => {
    if (isSending) return "Sending...";
    if (sendStatus === "success")
      return (
        <>
          <Check className="w-4 h-4 mr-2" /> Sent Successfully
        </>
      );
    if (sendStatus === "error")
      return (
        <>
          <X className="w-4 h-4 mr-2" /> Failed to Send
        </>
      );
    return "Send Referral";
  };

  return (
    <DoctorLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Referral Program</h1>

        <Tabs defaultValue="refer" className="space-y-6">
          <TabsList>
            <TabsTrigger value="refer">Refer Friends</TabsTrigger>
            <TabsTrigger value="history">Referral History</TabsTrigger>
          </TabsList>

          <TabsContent value="refer">
            <Card>
              <CardHeader>
                <CardTitle>Refer Friends & Earn Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Share your referral program with friends and family. When
                  they join and make their first purchase, you'll both earn
                  loyalty points!
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="friend@example.com, colleague@example.com"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    className="flex-grow"
                  />
                  <Button onClick={handleSendReferrals} disabled={isSending || !emails.trim()}>
                    {buttonContent()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <ReferralTimeline
              hideLoyaltyProgramDetails={true}
              hideSeniorityBadges={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default Referral;

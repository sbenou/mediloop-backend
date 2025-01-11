import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import AvatarUpload from "./AvatarUpload";

interface ProfileDisplayProps {
  profile: Tables<"profiles"> | null;
  onEdit: () => void;
  onScanCNS: () => void;
}

export function ProfileDisplay({ profile, onEdit, onScanCNS }: ProfileDisplayProps) {
  if (!profile) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-6">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            onAvatarUpdate={(url) => {
              // Profile will be automatically updated through React Query invalidation
            }}
          />
          
          <div className="w-full space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>

            <div className="grid gap-4 w-full">
              <div>
                <span className="font-medium">Date of Birth:</span>{" "}
                {profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString()
                  : "Not set"}
              </div>
              <div>
                <span className="font-medium">CNS Number:</span>{" "}
                {profile.cns_number || "Not set"}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button onClick={onEdit}>
                Edit Profile
              </Button>
              <Button variant="outline" onClick={onScanCNS}>
                Scan CNS Card
              </Button>
            </div>

            {profile.cns_card_front && (
              <div className="mt-4">
                <span className="font-medium block mb-2">CNS Card Images:</span>
                <div className="flex gap-4 justify-center">
                  <img
                    src={profile.cns_card_front}
                    alt="CNS Card Front"
                    className="w-48 h-auto rounded border"
                  />
                  {profile.cns_card_back && (
                    <img
                      src={profile.cns_card_back}
                      alt="CNS Card Back"
                      className="w-48 h-auto rounded border"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
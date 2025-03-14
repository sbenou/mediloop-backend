
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import AvatarUpload from "./AvatarUpload";
import CNSCardDisplay from "../CNSCardDisplay";

interface ProfileDisplayProps {
  profile: Tables<"profiles"> | null;
  onEdit: () => void;
  onScanCNS: () => void;
  onAvatarUpdate?: (url: string) => void;
}

export function ProfileDisplay({ profile, onEdit, onScanCNS, onAvatarUpdate }: ProfileDisplayProps) {
  if (!profile) return null;

  console.log('Profile Display - CNS card data:', {
    front: profile.cns_card_front,
    back: profile.cns_card_back,
    number: profile.cns_number
  }); // Debug log

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-6">
            <div>
              <AvatarUpload
                currentAvatarUrl={profile.avatar_url}
                onAvatarUpdate={(url) => {
                  console.log("Avatar updated with URL:", url);
                  if (onAvatarUpdate) {
                    onAvatarUpdate(url);
                  }
                }}
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>

              <div className="space-y-2">
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

              <div className="flex gap-3">
                <Button onClick={onEdit}>
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={onScanCNS}>
                  Scan CNS Card
                </Button>
              </div>
            </div>
          </div>

          {profile.cns_card_front && (
            <div>
              <span className="font-medium block mb-2">CNS Card:</span>
              <CNSCardDisplay
                frontImage={profile.cns_card_front}
                backImage={profile.cns_card_back || ''}
                cardNumber={profile.cns_number || ''}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

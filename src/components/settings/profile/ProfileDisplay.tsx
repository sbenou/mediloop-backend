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
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              onAvatarUpdate={(url) => {
                // Profile will be automatically updated through React Query invalidation
              }}
            />
          </div>
          <div className="flex-grow space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <p className="text-gray-500">{profile.email}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={onEdit}>
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={onScanCNS}>
                  Scan CNS Card
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-semibold">Date of Birth:</span>{" "}
                {profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString()
                  : "Not set"}
              </div>
              <div>
                <span className="font-semibold">CNS Number:</span>{" "}
                {profile.cns_number || "Not set"}
              </div>
              {profile.cns_card_front && (
                <div className="mt-4">
                  <span className="font-semibold block mb-2">CNS Card Images:</span>
                  <div className="flex gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
}
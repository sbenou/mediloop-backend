import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import AvatarUpload from "./AvatarUpload";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ProfileDisplayProps {
  profile: {
    full_name: string;
    email: string;
    date_of_birth: string | null;
    avatar_url: string | null;
  };
  onEdit: () => void;
}

export const ProfileDisplay = ({ profile, onEdit }: ProfileDisplayProps) => {
  const queryClient = useQueryClient();

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  return (
    <div className="space-y-6">
      <AvatarUpload 
        currentAvatarUrl={profile.avatar_url}
        onAvatarUpdate={handleAvatarUpdate}
      />
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Full Name</label>
          <p className="mt-1 text-lg">{profile.full_name || 'Not provided'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="mt-1 text-lg">{profile.email || 'Not provided'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
          <p className="mt-1 text-lg">
            {profile.date_of_birth ? format(new Date(profile.date_of_birth), 'PPP') : 'Not provided'}
          </p>
        </div>
        <Button onClick={onEdit}>Edit Profile</Button>
      </div>
    </div>
  );
};
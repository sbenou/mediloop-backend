import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/user";

interface ProfileDisplayProps {
  profile: {
    full_name: string;
    email: string;
    date_of_birth: string | null;
  };
  onEdit: () => void;
}

export const ProfileDisplay = ({ profile, onEdit }: ProfileDisplayProps) => {
  return (
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
  );
};

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { User, Camera } from "lucide-react";
import { UserProfile } from "@/types/user";

interface ProfileDisplayProps {
  profile?: UserProfile;
  onEdit?: () => void;
  onScanCNS?: () => void;
}

const ProfileDisplay = ({ profile, onEdit, onScanCNS }: ProfileDisplayProps) => {
  const { user, profile: userProfile } = useAuth();
  
  // Use passed profile if available, otherwise use from auth context
  const displayProfile = profile || userProfile;

  const profileImage = displayProfile?.role === 'pharmacist' ? 
    displayProfile?.pharmacy_logo_url || displayProfile?.avatar_url : 
    displayProfile?.avatar_url;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            View your profile information here.
          </CardDescription>
        </div>
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            Edit Profile
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            {profileImage ? (
              <AvatarImage src={profileImage} alt="Profile" />
            ) : (
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayProfile?.full_name || "No Name"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.email || displayProfile?.email || "No Email"}
            </p>
          </div>
        </div>
        
        {displayProfile?.role === 'patient' && onScanCNS && (
          <Button variant="outline" onClick={onScanCNS} className="mt-4">
            <Camera className="mr-2 h-4 w-4" />
            Scan CNS Card
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileDisplay;

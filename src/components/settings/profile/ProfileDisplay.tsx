import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { User } from "lucide-react";

const ProfileDisplay = () => {
  const { user, profile: userProfile } = useAuth();

  const profileImage = userProfile?.role === 'pharmacist' ? 
    userProfile?.pharmacy_logo_url || userProfile?.avatar_url : 
    userProfile?.avatar_url;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          View your profile information here.
        </CardDescription>
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
              {userProfile?.full_name || "No Name"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.email || "No Email"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileDisplay;

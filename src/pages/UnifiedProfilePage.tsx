
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PersonalDetails from "@/components/settings/PersonalDetails";

const UnifiedProfilePage = () => {
  const { profile, userRole } = useAuth();

  return (
    <UnifiedLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {profile?.full_name || "Not set"}</p>
              <p><span className="font-medium">Email:</span> {profile?.email || "Not set"}</p>
              <p><span className="font-medium">Role:</span> {userRole || "patient"}</p>
            </div>
          </CardContent>
        </Card>
        
        <PersonalDetails />
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;

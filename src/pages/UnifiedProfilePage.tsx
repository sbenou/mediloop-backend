
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalDetails />
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Security settings will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;

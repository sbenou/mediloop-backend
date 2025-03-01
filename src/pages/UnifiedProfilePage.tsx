
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PersonalDetails from "@/components/settings/PersonalDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UnifiedProfilePage = () => {
  const { profile, userRole } = useAuth();

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Personal Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
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
            
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Prescriptions</h3>
                    <p className="text-3xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">Active prescriptions</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Orders</h3>
                    <p className="text-3xl font-bold">2</p>
                    <p className="text-sm text-muted-foreground">Recent orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <PersonalDetails />
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;

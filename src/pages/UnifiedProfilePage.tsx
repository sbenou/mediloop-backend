
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UnifiedProfilePage = () => {
  const { profile } = useAuth();

  return (
    <UnifiedLayout>
      <div className="flex h-full gap-6">
        {/* Left content section */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'User'}</h1>
            <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Total active prescriptions</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Total orders placed</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Connected healthcare providers</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Teleconsultations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Upcoming appointments</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right section - same width as sidebar */}
        <div className="w-64 border-l bg-white p-4">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">No recent activity to display</p>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;

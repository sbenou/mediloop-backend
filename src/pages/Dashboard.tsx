
import PatientLayout from "@/components/layout/PatientLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";
import { CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');

  // Log for debugging
  useEffect(() => {
    console.log("Dashboard page loaded with view:", view);
  }, [view]);

  // Render settings view when requested
  if (view === "settings") {
    return (
      <PatientLayout>
        <div>
          <h1 className="text-3xl font-bold mb-8 text-left">Account Settings</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-left">Password Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PasswordChange />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountDeletion />
              </CardContent>
            </Card>
          </div>
        </div>
      </PatientLayout>
    );
  }

  // Default dashboard view
  return (
    <PatientLayout>
      <div className="space-y-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'sam testington'}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your healthcare information
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <h3 className="font-medium">Prescriptions</h3>
              <p className="text-sm text-muted-foreground">Total active prescriptions</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <h3 className="font-medium">Orders</h3>
              <p className="text-sm text-muted-foreground">Total orders placed</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <h3 className="font-medium">Doctors</h3>
              <p className="text-sm text-muted-foreground">Connected healthcare providers</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <h3 className="font-medium">Teleconsultations</h3>
              <p className="text-sm text-muted-foreground">Upcoming appointments</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default Dashboard;

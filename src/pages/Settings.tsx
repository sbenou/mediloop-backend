
import PatientLayout from "@/components/layout/PatientLayout";
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
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
};

export default Settings;


import Header from "@/components/layout/Header";
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-left">Account Settings</h1>
        
        <div className="max-w-2xl mx-auto space-y-6">
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
    </div>
  );
};

export default Settings;

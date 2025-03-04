
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";

interface SettingsViewProps {
  userRole: string | null;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userRole }) => {
  // Role-specific settings configurations
  const getRoleSpecificSettings = () => {
    // Common settings for all roles
    const commonSettings = [
      {
        title: "Password Management",
        component: <PasswordChange />
      },
      {
        title: "Danger Zone",
        component: <AccountDeletion />
      }
    ];
    
    // Additional role-specific settings
    switch (userRole) {
      case 'doctor':
        return [
          ...commonSettings,
          {
            title: "Professional Settings",
            component: <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Configure your professional doctor settings, certification, and stamp signature.
              </p>
            </div>
          }
        ];
      case 'pharmacist':
        return [
          ...commonSettings,
          {
            title: "Pharmacy Settings",
            component: <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                Configure your pharmacy business settings, hours, and delivery options.
              </p>
            </div>
          }
        ];
      case 'superadmin':
        return [
          ...commonSettings,
          {
            title: "System Settings",
            component: <div className="p-4 bg-purple-50 rounded-md">
              <p className="text-sm text-purple-700">
                Configure global platform settings and permissions.
              </p>
            </div>
          }
        ];
      case 'patient':
      default:
        return commonSettings;
    }
  };

  const settings = getRoleSpecificSettings();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-left">Account Settings</h1>
      
      <div className="space-y-6">
        {settings.map((setting, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-left">{setting.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {setting.component}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsView;

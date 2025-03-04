
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface ProfileViewProps {
  activeTab: string;
  userRole: string | null;
}

const ProfileView: React.FC<ProfileViewProps> = ({ activeTab, userRole }) => {
  const navigate = useNavigate();

  // Handle tab change
  const handleTabChange = (value: string) => {
    navigate(`/dashboard?view=profile&profileTab=${value}`);
  };

  // Get role-specific tabs configuration
  const getTabs = () => {
    // Common tabs for all users
    const commonTabs = [
      { id: 'personal', label: 'Personal Info' },
      { id: 'addresses', label: 'Addresses' }
    ];
    
    // Role-specific additional tabs
    switch (userRole) {
      case 'patient':
        return [
          ...commonTabs,
          { id: 'pharmacy', label: 'Default Pharmacy' },
          { id: 'doctor', label: 'My Doctor' },
          { id: 'nextofkin', label: 'Next of Kin' }
        ];
      case 'doctor':
        return [
          ...commonTabs,
          { id: 'qualifications', label: 'Qualifications' },
          { id: 'clinic', label: 'Clinic Details' }
        ];
      case 'pharmacist':
        return [
          ...commonTabs,
          { id: 'pharmacy', label: 'Pharmacy Details' },
          { id: 'staff', label: 'Staff Management' }
        ];
      case 'superadmin':
        return [
          ...commonTabs,
          { id: 'admin', label: 'Admin Settings' }
        ];
      default:
        return commonTabs;
    }
  };

  const tabs = getTabs();

  // Render tab content based on role and active tab
  const renderTabContent = (tabId: string) => {
    // Placeholder content for all tabs
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{tabs.find(tab => tab.id === tabId)?.label}</h2>
        <p className="text-muted-foreground">
          {userRole === 'patient' && tabId === 'personal' ? (
            "Your personal information will be displayed here."
          ) : userRole === 'doctor' && tabId === 'qualifications' ? (
            "Your medical qualifications and certifications will be displayed here."
          ) : tabId === 'addresses' ? (
            "No addresses found. Add your first address to get started."
          ) : (
            `No ${tabId} information found.`
          )}
        </p>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {renderTabContent(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProfileView;

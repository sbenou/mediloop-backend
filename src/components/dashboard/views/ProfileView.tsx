
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

// Import the components for each section
import PersonalDetails from "@/components/settings/PersonalDetails";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";

interface ProfileViewProps {
  activeTab: string;
  userRole: string | null;
}

const ProfileView: React.FC<ProfileViewProps> = ({ activeTab, userRole }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("ProfileView: Tab changed to:", value);
    navigate(`/dashboard?view=profile&profileTab=${value}`);
  };

  // Get role-specific tabs configuration
  const getTabs = () => {
    // Common tabs for all users
    const commonTabs = [
      { id: 'personal', label: 'Personal Info' },
      { id: 'addresses', label: 'Addresses' },
      { id: 'nextofkin', label: 'Next of Kin' }
    ];
    
    // Role-specific additional tabs
    switch (userRole) {
      case 'patient':
        return [
          ...commonTabs,
          { id: 'pharmacy', label: 'Default Pharmacy' },
          { id: 'doctor', label: 'My Doctor' }
        ];
      case 'doctor':
        return [
          ...commonTabs,
          { id: 'qualifications', label: 'Qualifications' },
          { id: 'clinic', label: 'Clinic Details' }
        ];
      case 'pharmacist':
        return commonTabs;
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

  // Determine which tab should be active or use the first tab as default
  const currentActiveTab = activeTab || tabs[0].id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your personal information should be kept up to date to ensure the best service experience.
        </p>
      </div>
      
      <Tabs defaultValue={currentActiveTab} value={currentActiveTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Personal Info Tab */}
        <TabsContent value="personal" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <PersonalDetails />
          </div>
        </TabsContent>
        
        {/* Addresses Tab */}
        <TabsContent value="addresses" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Addresses</h2>
            <AddressManagement />
          </div>
        </TabsContent>
        
        {/* Pharmacy Tab - Only for patients */}
        {userRole === 'patient' && (
          <TabsContent value="pharmacy" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Default Pharmacy</h2>
              <PharmacySelection />
            </div>
          </TabsContent>
        )}
        
        {/* Doctor Tab - Only for patients */}
        {userRole === 'patient' && (
          <TabsContent value="doctor" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">My Doctor</h2>
              <DoctorManagement />
            </div>
          </TabsContent>
        )}
        
        {/* Next of Kin Tab */}
        <TabsContent value="nextofkin" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Next of Kin</h2>
            <NextOfKinManagement />
          </div>
        </TabsContent>
        
        {/* Additional role-specific tabs */}
        {userRole === 'doctor' && (
          <>
            <TabsContent value="qualifications" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
                <p>Your medical qualifications and certifications will be displayed here.</p>
              </div>
            </TabsContent>
            <TabsContent value="clinic" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Clinic Details</h2>
                <p>Your clinic information will be displayed here.</p>
              </div>
            </TabsContent>
          </>
        )}
        
        {userRole === 'superadmin' && (
          <TabsContent value="admin" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
              <p>Administrative settings will be displayed here.</p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProfileView;

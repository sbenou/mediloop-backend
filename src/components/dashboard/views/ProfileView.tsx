
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Fixing import errors by using default imports instead of named imports
import PersonalDetails from "@/components/settings/PersonalDetails";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";

interface ProfileViewProps {
  activeTab: string;
  userRole: string | null;
}

const ProfileView = ({ activeTab, userRole }: ProfileViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(activeTab || "personal");

  useEffect(() => {
    if (activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    searchParams.set("profileTab", value);
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and profile settings.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Details</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          <TabsTrigger value="doctor">Doctor</TabsTrigger>
          <TabsTrigger value="nextofkin">Next of Kin</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="space-y-4">
          <PersonalDetails />
        </TabsContent>
        
        <TabsContent value="addresses" className="space-y-4">
          <AddressManagement />
        </TabsContent>
        
        <TabsContent value="pharmacy" className="space-y-4">
          <PharmacySelection />
        </TabsContent>
        
        <TabsContent value="doctor" className="space-y-4">
          <DoctorManagement />
        </TabsContent>
        
        <TabsContent value="nextofkin" className="space-y-4">
          <NextOfKinManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Make sure to export as default
export default ProfileView;

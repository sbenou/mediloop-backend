
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import PersonalDetails from "@/components/settings/PersonalDetails";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";
import PatientLayout from "@/components/layout/PatientLayout";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personal';

  useEffect(() => {
    console.log('Profile page rendered with tab:', activeTab);
  }, [activeTab]);

  return (
    <PatientLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <Tabs defaultValue={activeTab} value={activeTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="doctor">Doctor</TabsTrigger>
            <TabsTrigger value="nextofkin">Next of Kin</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalDetails />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressManagement />
          </TabsContent>

          <TabsContent value="pharmacy">
            <PharmacySelection />
          </TabsContent>

          <TabsContent value="doctor">
            <DoctorManagement />
          </TabsContent>

          <TabsContent value="nextofkin">
            <NextOfKinManagement />
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
};

export default Profile;


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import PersonalDetails from "@/components/settings/PersonalDetails";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";
import Header from "@/components/layout/Header";

const Profile = () => {
  return (
    <div>
      <Header />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <Tabs defaultValue="personal" className="space-y-4">
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
    </div>
  );
};

export default Profile;

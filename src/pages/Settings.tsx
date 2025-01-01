import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AddressManagement from "@/components/settings/AddressManagement";
import PasswordChange from "@/components/settings/PasswordChange";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";

const Settings = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="addresses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          <TabsTrigger value="doctor">Doctor</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="addresses">
          <AddressManagement />
        </TabsContent>

        <TabsContent value="pharmacy">
          <PharmacySelection />
        </TabsContent>

        <TabsContent value="doctor">
          <DoctorManagement />
        </TabsContent>

        <TabsContent value="password">
          <Card className="p-6">
            <PasswordChange />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
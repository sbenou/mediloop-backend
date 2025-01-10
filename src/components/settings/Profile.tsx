import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import PersonalDetails from "@/components/settings/PersonalDetails";
import Header from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  return (
    <div>
      <Header session={session} />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="doctor">Doctor</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
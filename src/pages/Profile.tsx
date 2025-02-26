
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import PersonalDetails from "@/components/settings/PersonalDetails";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "personal";

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    searchParams.set("tab", value);
    setSearchParams(searchParams);
  };

  // Set default tab if none is specified
  useEffect(() => {
    if (!searchParams.has("tab")) {
      searchParams.set("tab", "personal");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="container mx-auto py-8 px-4 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
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
    </div>
  );
};

export default Profile;

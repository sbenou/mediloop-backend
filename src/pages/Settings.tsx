import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import AddressManagement from "@/components/settings/AddressManagement";
import PasswordChange from "@/components/settings/PasswordChange";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/')} 
              className="hover:text-primary hover:underline cursor-pointer"
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Settings</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold text-primary mb-8">Settings</h1>

      <Card className="p-6">
        <Tabs defaultValue="addresses" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="addresses">
            <AddressManagement />
          </TabsContent>
          <TabsContent value="password">
            <PasswordChange />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
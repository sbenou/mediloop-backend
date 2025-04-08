
import React, { useState } from "react";
import ProfessionalProfile from "@/components/professional/ProfessionalProfile";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";

const DoctorProfilePage = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const navigate = useNavigate();
  
  const handleNavigateToWorkplaces = () => {
    navigate('/dashboard?view=doctor&section=workplaces');
  };

  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Doctor Profile</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfessionalProfile role="doctor" />
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Workplaces Management
            </h2>
            <p className="mb-4 text-muted-foreground">
              Managing your workplaces and availability has moved to a dedicated section for better organization.
            </p>
            <Button onClick={handleNavigateToWorkplaces}>
              Go to Workplaces Management
            </Button>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfilePage;

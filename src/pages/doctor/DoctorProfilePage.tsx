
import React, { useState } from "react";
import ProfessionalProfile from "@/components/professional/ProfessionalProfile";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import DoctorWorkplaceSelection from "@/components/doctor/DoctorWorkplaceSelection";
import WorkplaceAvailability from "@/components/doctor/WorkplaceAvailability";

const DoctorProfilePage = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Doctor Profile</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="workplaces">Workplaces</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfessionalProfile role="doctor" />
          </TabsContent>
          
          <TabsContent value="workplaces">
            <DoctorWorkplaceSelection />
          </TabsContent>
          
          <TabsContent value="availability">
            <WorkplaceAvailability />
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfilePage;


import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useDashboardParams from '@/hooks/dashboard/useDashboardParams';
import DoctorWorkplaceSelection from "@/components/doctor/DoctorWorkplaceSelection";
import WorkplaceAvailability from "@/components/doctor/WorkplaceAvailability";

const WorkplacesView = () => {
  const { params, updateParams } = useDashboardParams();
  const activeTab = params.workplacesTab || 'selection';

  const handleTabChange = (tab: string) => {
    updateParams({ workplacesTab: tab });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Workplaces Management</h1>
        <p className="text-muted-foreground">
          Manage your practice locations and availability schedule.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="selection">Workplace Selection</TabsTrigger>
          <TabsTrigger value="availability">Availability Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="selection" className="pt-6">
          <DoctorWorkplaceSelection />
        </TabsContent>
        
        <TabsContent value="availability" className="pt-6">
          <WorkplaceAvailability />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkplacesView;

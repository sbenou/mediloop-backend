
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DoctorAvailabilityCalendar from "@/components/teleconsultation/DoctorAvailabilityCalendar";
import AvailabilityWeeklyCalendar from "@/components/teleconsultation/AvailabilityWeeklyCalendar";
import TeleconsultationList from "@/components/teleconsultation/TeleconsultationList";
import { useAuth } from "@/hooks/auth/useAuth";
import type { Teleconsultation } from "@/types/clinical";

const DoctorTeleconsultationsView = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("consultations");
  const [activeMeeting, setActiveMeeting] = useState<Teleconsultation | null>(null);

  const handleJoinMeeting = (consultation: Teleconsultation) => {
    // Logic to join the meeting would go here
    setActiveMeeting(consultation);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Virtual Appointments</h1>
      <p className="text-muted-foreground mb-6">
        Manage your virtual appointments and availability schedule
      </p>

      <Tabs 
        defaultValue={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="consultations">My Consultations</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Calendar</TabsTrigger>
          <TabsTrigger value="availability">Availability Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Teleconsultations</CardTitle>
              <CardDescription>
                Your scheduled virtual appointments with patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeleconsultationList 
                onJoinMeeting={handleJoinMeeting} 
                filterRole="doctor"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <AvailabilityWeeklyCalendar 
            doctorId={profile?.id} 
            doctorName="your"
          />
        </TabsContent>

        <TabsContent value="availability">
          <DoctorAvailabilityCalendar 
            doctorId={profile?.id || ''} 
            isManagementMode={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorTeleconsultationsView;

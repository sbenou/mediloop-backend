
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import JitsiMeetingRoom from "@/components/teleconsultation/JitsiMeetingRoom";
import TeleconsultationList from "@/components/teleconsultation/TeleconsultationList";
import DoctorConnectionsList from "@/components/teleconsultation/DoctorConnectionsList";
import DoctorAvailabilityCalendar from "@/components/teleconsultation/DoctorAvailabilityCalendar";
import TeleconsultationExplanation from "@/components/teleconsultation/TeleconsultationExplanation";
import AvailabilityWeeklyCalendar from "@/components/teleconsultation/AvailabilityWeeklyCalendar";

interface TeleconsultationsViewProps {
  userRole: string | null;
}

// Define teleconsultation type for the view
interface Teleconsultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  room_id?: string;
  patient?: {
    full_name: string;
    email: string;
  };
  doctor?: {
    full_name: string;
    email: string;
  };
}

const TeleconsultationsView: React.FC<TeleconsultationsViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const requestParam = searchParams.get('request');
  const showHowItWorksParam = searchParams.get('howItWorks');
  
  const [view, setView] = useState<'list' | 'scheduler' | 'meeting' | 'howItWorks' | 'weekly'>('list');
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Teleconsultation | null>(null);
  const [activeTab, setActiveTab] = useState<string>("list");

  // Set initial view based on URL parameters
  useEffect(() => {
    if (requestParam === 'new' && userRole === 'patient') {
      setView('scheduler');
      setActiveTab('scheduler');
    } else if (showHowItWorksParam === 'true') {
      setView('howItWorks');
      setActiveTab('howItWorks');
    }
  }, [requestParam, showHowItWorksParam, userRole]);

  const getViewTitle = () => {
    switch (userRole) {
      case 'patient':
        return 'Teleconsultations';
      case 'doctor':
        return 'Virtual Appointments';
      default:
        return 'Teleconsultations';
    }
  };

  const getViewDescription = () => {
    switch (userRole) {
      case 'patient':
        return 'Schedule and manage your video consultations with doctors';
      case 'doctor':
        return 'Manage your virtual appointment schedule';
      default:
        return 'Video consultation management';
    }
  };

  const handleSelectDoctor = (doctorId: string, doctorName: string) => {
    setSelectedDoctor({ id: doctorId, name: doctorName });
    setView('scheduler');
    setActiveTab('scheduler');
  };

  const handleJoinMeeting = (consultation: Teleconsultation) => {
    setActiveMeeting(consultation);
    setView('meeting');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    switch (value) {
      case 'weekly':
        setView('weekly');
        break;
      case 'scheduler':
        setView('scheduler');
        break;
      case 'howItWorks':
        setView('howItWorks');
        break;
      default:
        setView('list');
        break;
    }
  };

  // Only doctors and pharmacists should see the weekly calendar
  const showWeeklyCalendar = userRole === 'doctor' || userRole === 'pharmacist';

  if (view === 'meeting' && activeMeeting) {
    return (
      <JitsiMeetingRoom
        roomName={`consultation-${activeMeeting.id}`}
        consultationId={activeMeeting.id}
        onClose={() => {
          setView('list');
          setActiveTab('list');
          setActiveMeeting(null);
        }}
        patientName={activeMeeting.patient?.full_name}
        doctorName={activeMeeting.doctor?.full_name}
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{getViewTitle()}</h1>
      <p className="text-muted-foreground mb-6">{getViewDescription()}</p>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">My Consultations</TabsTrigger>
          {showWeeklyCalendar && <TabsTrigger value="weekly">Weekly Calendar</TabsTrigger>}
          <TabsTrigger value="scheduler">
            {userRole === 'doctor' ? 'Availability Settings' : 'Request Consultation'}
          </TabsTrigger>
          <TabsTrigger value="howItWorks">How It Works</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-0">
          <div className="space-y-6">
            {userRole === 'patient' && (
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Teleconsultations</h2>
                <Button onClick={() => { setView('scheduler'); setActiveTab('scheduler'); }}>
                  Request New Consultation
                </Button>
              </div>
            )}
            
            <TeleconsultationList onJoinMeeting={handleJoinMeeting} />
          </div>
        </TabsContent>
        
        {showWeeklyCalendar && (
          <TabsContent value="weekly" className="mt-0">
            <AvailabilityWeeklyCalendar 
              doctorId={userRole === 'doctor' ? profile?.id : undefined}
              isManagementMode={userRole === 'pharmacist'}
            />
          </TabsContent>
        )}
        
        <TabsContent value="scheduler" className="mt-0">
          {userRole === 'doctor' ? (
            <DoctorAvailabilityCalendar 
              doctorId={profile?.id || ''} 
            />
          ) : (
            selectedDoctor ? (
              <DoctorAvailabilityCalendar
                doctorId={selectedDoctor.id}
                doctorName={selectedDoctor.name}
                onBookingConfirmed={() => { setView('list'); setActiveTab('list'); }}
              />
            ) : (
              <DoctorConnectionsList onSelectDoctor={handleSelectDoctor} />
            )
          )}
        </TabsContent>
        
        <TabsContent value="howItWorks" className="mt-0">
          <TeleconsultationExplanation />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeleconsultationsView;

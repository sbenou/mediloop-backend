
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSearchParams } from "react-router-dom";
import JitsiMeetingRoom from "@/components/teleconsultation/JitsiMeetingRoom";
import TeleconsultationList from "@/components/teleconsultation/TeleconsultationList";
import DoctorConnectionsList from "@/components/teleconsultation/DoctorConnectionsList";
import DoctorAvailabilityCalendar from "@/components/teleconsultation/DoctorAvailabilityCalendar";
import TeleconsultationExplanation from "@/components/teleconsultation/TeleconsultationExplanation";

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
  
  const [view, setView] = useState<'list' | 'scheduler' | 'meeting' | 'howItWorks'>('list');
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Teleconsultation | null>(null);

  // Set initial view based on URL parameters
  useEffect(() => {
    if (requestParam === 'new' && userRole === 'patient') {
      setView('scheduler');
    } else if (showHowItWorksParam === 'true') {
      setView('howItWorks');
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
  };

  const handleJoinMeeting = (consultation: Teleconsultation) => {
    setActiveMeeting(consultation);
    setView('meeting');
  };

  const renderContent = () => {
    if (view === 'meeting' && activeMeeting) {
      return (
        <JitsiMeetingRoom
          roomName={`consultation-${activeMeeting.id}`}
          consultationId={activeMeeting.id}
          onClose={() => {
            setView('list');
            setActiveMeeting(null);
          }}
          patientName={activeMeeting.patient?.full_name}
          doctorName={activeMeeting.doctor?.full_name}
        />
      );
    }

    if (view === 'howItWorks') {
      return (
        <div>
          <Button 
            variant="outline" 
            onClick={() => setView('list')} 
            className="mb-4"
          >
            Back to Teleconsultations
          </Button>
          <TeleconsultationExplanation />
        </div>
      );
    }

    if (view === 'scheduler') {
      return (
        <div>
          <Button 
            variant="outline" 
            onClick={() => setView('list')} 
            className="mb-4"
          >
            Back to Teleconsultations
          </Button>
          
          {selectedDoctor ? (
            <DoctorAvailabilityCalendar
              doctorId={selectedDoctor.id}
              doctorName={selectedDoctor.name}
              onBookingConfirmed={() => setView('list')}
            />
          ) : (
            <DoctorConnectionsList onSelectDoctor={handleSelectDoctor} />
          )}
        </div>
      );
    }

    // Default view - list
    return (
      <div className="space-y-6">
        <TeleconsultationExplanation />
        
        {userRole === 'patient' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Teleconsultations</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setView('howItWorks')}
                >
                  How It Works
                </Button>
                <Button onClick={() => setView('scheduler')}>
                  Request New Consultation
                </Button>
              </div>
            </div>
          </>
        )}
        
        <TeleconsultationList onJoinMeeting={handleJoinMeeting} />
      </div>
    );
  };

  return (
    <div>
      {view !== 'meeting' && (
        <>
          <h1 className="text-3xl font-bold mb-2">{getViewTitle()}</h1>
          <p className="text-muted-foreground mb-6">{getViewDescription()}</p>
        </>
      )}
      
      {renderContent()}
    </div>
  );
};

export default TeleconsultationsView;

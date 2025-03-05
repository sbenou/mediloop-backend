
import React, { useEffect, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface JitsiMeetingRoomProps {
  roomName: string;
  onClose: () => void;
  consultationId: string;
  patientName?: string;
  doctorName?: string;
}

const JitsiMeetingRoom: React.FC<JitsiMeetingRoomProps> = ({ 
  roomName, 
  onClose, 
  consultationId,
  patientName,
  doctorName
}) => {
  const { profile, userRole } = useAuth();
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate a secure domain-specific room name using the consultationId
  const secureRoomName = `consultation-${consultationId}`;
  
  // Configuration for the Jitsi meeting
  const jitsiConfig = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    disableDeepLinking: true,
    prejoinPageEnabled: true,
    disableInviteFunctions: true,
    enableClosePage: false
  };

  // User information to display in the meeting
  const userInfo = {
    displayName: profile?.full_name || 'User',
    email: profile?.email || '',
  };

  // Handle API events when the component is mounted
  const handleAPILoad = (api: any) => {
    // Event handlers for the Jitsi Meet API
    api.addEventListener('videoConferenceLeft', () => {
      console.log('User has left the meeting');
      setIsCallEnded(true);
    });

    api.addEventListener('connectionFailed', () => {
      console.error('Connection to the conference failed');
      setErrorMessage('Failed to connect to the video call. Please try again.');
    });

    api.addEventListener('participantJoined', (participant: any) => {
      console.log(`${participant.displayName} has joined the meeting`);
    });

    api.addEventListener('participantLeft', (participant: any) => {
      console.log(`${participant.displayName} has left the meeting`);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {errorMessage && (
        <Card className="mb-4 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>
              {userRole === 'doctor' 
                ? `Consultation with ${patientName || 'Patient'}`
                : `Consultation with Dr. ${doctorName || 'Doctor'}`}
            </span>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </CardTitle>
          <CardDescription>
            Consultation ID: {consultationId}
          </CardDescription>
        </CardHeader>
      </Card>

      {isCallEnded ? (
        <Card>
          <CardHeader>
            <CardTitle>Call Ended</CardTitle>
            <CardDescription>Your teleconsultation has ended.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={onClose}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="flex-1 h-[600px] border rounded-md overflow-hidden">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={secureRoomName}
            configOverwrite={jitsiConfig}
            userInfo={userInfo}
            onApiReady={handleAPILoad}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default JitsiMeetingRoom;

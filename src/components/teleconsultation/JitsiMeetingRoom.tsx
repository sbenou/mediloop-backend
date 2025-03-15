
import React, { useEffect, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Video, User, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

interface JitsiMeetingRoomProps {
  roomName: string;
  consultationId: string;
  onClose: () => void;
  patientName?: string;
  doctorName?: string;
}

const JitsiMeetingRoom: React.FC<JitsiMeetingRoomProps> = ({
  roomName,
  consultationId,
  onClose,
  patientName,
  doctorName
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [consultationDetails, setConsultationDetails] = useState<{
    startTime: Date;
    endTime: Date;
    reason: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch consultation details
  useEffect(() => {
    const fetchConsultationDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('teleconsultations')
          .select('start_time, end_time, reason')
          .eq('id', consultationId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setConsultationDetails({
            startTime: new Date(data.start_time),
            endTime: new Date(data.end_time),
            reason: data.reason
          });
        }
      } catch (err) {
        console.error('Error fetching consultation details:', err);
        setError('Failed to load consultation details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsultationDetails();
  }, [consultationId]);
  
  // Mark consultation as completed when component unmounts
  useEffect(() => {
    return () => {
      // Update status to completed when leaving the meeting
      supabase
        .from('teleconsultations')
        .update({ status: 'completed' })
        .eq('id', consultationId)
        .then(({ error }) => {
          if (error) {
            console.error('Error marking consultation as completed:', error);
          }
        });
    };
  }, [consultationId]);
  
  // Configuration for Jitsi
  const jitsiConfig = {
    prejoinConfig: {
      enabled: false
    },
    disableDeepLinking: true,
    startWithAudioMuted: false,
    startWithVideoMuted: false
  };
  
  const handleMeetingClose = () => {
    onClose();
  };
  
  const handleApiReady = (apiObj: any) => {
    apiObj.executeCommand('displayName', doctorName || patientName || 'User');
    setIsLoading(false);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-background border-b py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleMeetingClose}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
          <div className="font-medium text-sm">
            {consultationDetails?.reason || 'Teleconsultation'}
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            {consultationDetails && (
              <span>
                {format(consultationDetails.startTime, 'MMM d, h:mm a')} - 
                {format(consultationDetails.endTime, 'h:mm a')}
              </span>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        {/* Jitsi Meeting Container */}
        <div className="lg:col-span-3 bg-gray-900 rounded-lg overflow-hidden relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mr-2"></div>
              <span>Loading meeting room...</span>
            </div>
          )}
          
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={jitsiConfig}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 
                'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
                'chat', 'recording', 'livestreaming', 'etherpad', 
                'settings', 'raisehand', 'videoquality', 'filmstrip', 
                'feedback', 'stats', 'shortcuts', 'tileview', 'select-background'
              ]
            }}
            onApiReady={handleApiReady}
            getIFrameRef={(node) => {
              // Adjust iframe styles if needed
              if (node) {
                node.style.width = '100%';
                node.style.height = '100%';
                node.style.minHeight = '500px';
              }
            }}
          />
        </div>
        
        {/* Info Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Teleconsultation</CardTitle>
              <CardDescription>
                {consultationDetails?.reason || 'Online appointment'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <p className="font-medium">
                    {consultationDetails && (
                      <>
                        {format(consultationDetails.startTime, 'MMMM d, yyyy')}
                        <br />
                        {format(consultationDetails.startTime, 'h:mm a')} - 
                        {format(consultationDetails.endTime, 'h:mm a')}
                      </>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Doctor</p>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">{doctorName || 'Doctor'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patient</p>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="font-medium">{patientName || 'Patient'}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Meeting Controls</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Use the toolbar at the bottom to control your camera and microphone</p>
                    <p>• Click the red button to leave the meeting</p>
                    <p>• Chat is available from the toolbar</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleMeetingClose}
              >
                End Consultation
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JitsiMeetingRoom;

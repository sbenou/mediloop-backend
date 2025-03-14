
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSearchParams } from "react-router-dom";
import JitsiMeetingRoom from "@/components/teleconsultation/JitsiMeetingRoom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Video, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Define teleconsultation type
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
}

const DoctorTeleconsultationsView = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const requestParam = searchParams.get('request');
  
  const [view, setView] = useState<'list' | 'calendar' | 'meeting'>('list');
  const [activeMeeting, setActiveMeeting] = useState<Teleconsultation | null>(null);
  const [consultations, setConsultations] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Set initial view based on URL parameters
  useEffect(() => {
    if (requestParam === 'calendar') {
      setView('calendar');
    }
  }, [requestParam]);

  // Fetch consultations
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('teleconsultations')
          .select(`
            *,
            patient:patient_id(full_name, email)
          `)
          .eq('doctor_id', profile.id)
          .order('start_time', { ascending: true });

        if (error) throw error;
        
        setConsultations(data || []);
      } catch (err) {
        console.error('Error fetching teleconsultations:', err);
        toast({
          variant: "destructive",
          title: "Failed to load consultations",
          description: "There was an error loading your consultations. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [profile?.id]);

  const handleJoinMeeting = (consultation: Teleconsultation) => {
    setActiveMeeting(consultation);
    setView('meeting');
  };

  const handleUpdateStatus = async (consultationId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('teleconsultations')
        .update({ status: newStatus })
        .eq('id', consultationId)
        .eq('doctor_id', profile?.id); // Safety check

      if (error) throw error;

      // Update local state
      setConsultations(consultations.map(c => 
        c.id === consultationId ? { ...c, status: newStatus } : c
      ));

      toast({
        title: `Consultation ${newStatus}`,
        description: `The teleconsultation has been ${newStatus}.`
      });
    } catch (err) {
      console.error(`Error ${newStatus} consultation:`, err);
      toast({
        variant: "destructive",
        title: "Action failed",
        description: `Failed to ${newStatus} the consultation. Please try again.`
      });
    }
  };

  const renderConsultationList = () => {
    if (loading) {
      return (
        <div className="space-y-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (consultations.length === 0) {
      return (
        <div className="bg-gray-100 rounded-lg p-8 text-center mt-4">
          <p className="text-lg">No teleconsultations scheduled</p>
          <p className="text-muted-foreground mt-2">
            You don't have any upcoming or pending teleconsultations with patients
          </p>
        </div>
      );
    }

    // Group consultations by status
    const pendingConsultations = consultations.filter(c => c.status === 'pending');
    const confirmedConsultations = consultations.filter(c => c.status === 'confirmed');
    const pastConsultations = consultations.filter(c => c.status === 'completed' || c.status === 'cancelled');

    return (
      <div className="space-y-8 mt-4">
        {pendingConsultations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Pending Requests</h3>
            <div className="space-y-4">
              {pendingConsultations.map(consultation => (
                <Card key={consultation.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {consultation.patient?.full_name || "Unknown Patient"}
                        </span>
                      </CardTitle>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {new Date(consultation.start_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(consultation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    {consultation.reason && (
                      <div>
                        <p className="text-sm text-muted-foreground">Reason:</p>
                        <p className="text-sm">{consultation.reason}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUpdateStatus(consultation.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Decline
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateStatus(consultation.id, 'confirmed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {confirmedConsultations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Upcoming Consultations</h3>
            <div className="space-y-4">
              {confirmedConsultations.map(consultation => {
                const isActive = new Date(consultation.start_time) <= new Date() && 
                                new Date(consultation.end_time) >= new Date();
                return (
                  <Card key={consultation.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {consultation.patient?.full_name || "Unknown Patient"}
                          </span>
                        </CardTitle>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Confirmed
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {new Date(consultation.start_time).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(consultation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      {isActive ? (
                        <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                          <p className="text-sm text-green-800 font-medium">This consultation is active now</p>
                        </div>
                      ) : null}
                      
                      <div className="flex justify-end">
                        <Button 
                          className={!isActive ? "opacity-50" : ""}
                          disabled={!isActive}
                          onClick={() => handleJoinMeeting(consultation)}
                        >
                          <Video className="h-4 w-4 mr-1" /> 
                          {isActive ? "Join Meeting" : "Will Be Active Soon"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {pastConsultations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Past Consultations</h3>
            <div className="space-y-4">
              {pastConsultations.slice(0, 5).map(consultation => (
                <Card key={consultation.id} className="border-l-4 border-l-gray-400 opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {consultation.patient?.full_name || "Unknown Patient"}
                        </span>
                      </CardTitle>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        {consultation.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {new Date(consultation.start_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">
                          {new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(consultation.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
          doctorName={profile?.full_name || "Doctor"}
        />
      );
    }

    if (view === 'calendar') {
      return (
        <div>
          <Button 
            variant="outline" 
            onClick={() => setView('list')} 
            className="mb-4"
          >
            Back to Consultations
          </Button>
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Your Availability Calendar</h3>
            <p className="text-muted-foreground mb-4">
              This calendar view will allow you to set your availability for teleconsultations.
              <br />
              <span className="text-sm">(Coming soon)</span>
            </p>
          </div>
        </div>
      );
    }

    // Default list view
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Teleconsultations</h2>
          <Button 
            variant="outline" 
            onClick={() => setView('calendar')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Manage Availability
          </Button>
        </div>
        
        {renderConsultationList()}
      </div>
    );
  };

  return (
    <div>
      {view !== 'meeting' && (
        <>
          <h1 className="text-3xl font-bold mb-2">Virtual Consultations</h1>
          <p className="text-muted-foreground mb-6">Manage your virtual appointments with patients</p>
        </>
      )}
      
      {renderContent()}
    </div>
  );
};

export default DoctorTeleconsultationsView;

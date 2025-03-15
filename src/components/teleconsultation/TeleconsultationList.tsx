
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { Video, Clock, Calendar } from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Teleconsultation } from "@/types/supabase";

interface TeleconsultationListProps {
  onJoinMeeting: (consultation: Teleconsultation) => void;
  filterRole?: string;
}

const TeleconsultationList: React.FC<TeleconsultationListProps> = ({ 
  onJoinMeeting, 
  filterRole 
}) => {
  const { profile } = useAuth();
  const [consultations, setConsultations] = useState<Teleconsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState(true);
  
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!profile?.id) return;
      
      setIsLoading(true);
      
      try {
        // Define the field to filter by based on the user's role
        const filterField = filterRole === "doctor" ? "doctor_id" : 
                          filterRole === "patient" ? "patient_id" : 
                          profile.role === "doctor" ? "doctor_id" : "patient_id";
        
        // Fetch teleconsultations
        const { data, error } = await supabase
          .from('teleconsultations')
          .select(`
            *,
            patient:profiles!teleconsultations_patient_id_fkey(full_name, email),
            doctor:profiles!teleconsultations_doctor_id_fkey(full_name, email)
          `)
          .eq(filterField, profile.id)
          .order('start_time', { ascending: true });
          
        if (error) throw error;
        
        // Filter out records where patient or doctor might be null or have an error
        const validConsultations = (data || []).filter(consultation => {
          // Check if patient data is valid (not null and doesn't contain error)
          const hasValidPatient = consultation.patient != null && 
                                  typeof consultation.patient === 'object' && 
                                  !('error' in consultation.patient);
                                  
          // Check if doctor data is valid (not null and doesn't contain error)
          const hasValidDoctor = consultation.doctor != null && 
                                 typeof consultation.doctor === 'object' && 
                                 !('error' in consultation.doctor);
                                 
          return hasValidPatient && hasValidDoctor;
        });
        
        // Create properly typed objects from filtered data
        const typedConsultations: Teleconsultation[] = validConsultations.map(consultation => {
          // We're extracting the patient data safely with proper null checks
          // We already filtered for null values above, but add extra type safety
          const patientData = {
            full_name: consultation.patient && 
                      typeof consultation.patient === 'object' && 
                      'full_name' in consultation.patient
              ? consultation.patient.full_name || 'Unknown Patient'
              : 'Unknown Patient',
            email: consultation.patient && 
                  typeof consultation.patient === 'object' && 
                  'email' in consultation.patient
              ? consultation.patient.email
              : null
          };
          
          // Similarly for doctor data
          const doctorData = {
            full_name: consultation.doctor && 
                      typeof consultation.doctor === 'object' && 
                      'full_name' in consultation.doctor
              ? consultation.doctor.full_name || 'Unknown Doctor'
              : 'Unknown Doctor',
            email: consultation.doctor && 
                  typeof consultation.doctor === 'object' && 
                  'email' in consultation.doctor
              ? consultation.doctor.email 
              : null
          };
          
          return {
            id: consultation.id,
            patient_id: consultation.patient_id,
            doctor_id: consultation.doctor_id,
            start_time: consultation.start_time,
            end_time: consultation.end_time,
            status: consultation.status,
            reason: consultation.reason,
            room_id: consultation.room_id,
            created_at: consultation.created_at,
            updated_at: consultation.updated_at,
            patient: patientData,
            doctor: doctorData
          };
        });
        
        setConsultations(typedConsultations);
        
        // Check if user has connections (for patients only)
        if (profile.role === 'patient') {
          const { count, error: connectionError } = await supabase
            .from('doctor_patient_connections')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', profile.id)
            .eq('status', 'accepted');
          
          if (connectionError) throw connectionError;
          
          setHasConnections(count !== null && count > 0);
        } else {
          // Doctors and pharmacists always have connections set to true
          setHasConnections(true);
        }
      } catch (err) {
        console.error('Error fetching teleconsultations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsultations();
  }, [profile, filterRole]);
  
  // Group consultations by status
  const upcomingConsultations = consultations.filter(c => 
    c.status === 'confirmed' && isFuture(new Date(c.start_time))
  );
  
  const todayConsultations = consultations.filter(c => 
    c.status === 'confirmed' && isToday(new Date(c.start_time))
  );
  
  const pastConsultations = consultations.filter(c => 
    (c.status === 'completed' || c.status === 'confirmed') && 
    isPast(new Date(c.end_time))
  );
  
  const pendingConsultations = consultations.filter(c => 
    c.status === 'pending'
  );
  
  const cancelledConsultations = consultations.filter(c => 
    c.status === 'cancelled'
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2">Loading teleconsultations...</span>
      </div>
    );
  }
  
  // Show connect with doctors message only for patients without connections
  const showConnectMessage = !hasConnections && profile?.role === 'patient';
  
  // Show empty state if no consultations and has connections
  const showEmptyState = consultations.length === 0 && !showConnectMessage;
  
  return (
    <div className="space-y-6">
      {showConnectMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Connect with Doctors</CardTitle>
            <CardDescription>
              You might need to connect with a doctor first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You don't have any teleconsultations yet. Connect with a doctor to schedule a teleconsultation.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/dashboard?view=teleconsultations&tab=scheduler">Connect with Doctors</a>
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {showEmptyState && (
        <Card>
          <CardHeader>
            <CardTitle>No Teleconsultations</CardTitle>
            <CardDescription>
              You don't have any teleconsultations scheduled yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>When you have teleconsultations scheduled, they will appear here.</p>
          </CardContent>
        </Card>
      )}
      
      {consultations.length > 0 && (
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">
              Today {todayConsultations.length > 0 && 
                <Badge variant="secondary" className="ml-1">{todayConsultations.length}</Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming {upcomingConsultations.length > 0 && 
                <Badge variant="secondary" className="ml-1">{upcomingConsultations.length}</Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pendingConsultations.length > 0 && 
                <Badge variant="secondary" className="ml-1">{pendingConsultations.length}</Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-4">
            {todayConsultations.length === 0 ? (
              <p className="text-muted-foreground">No teleconsultations scheduled for today.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {todayConsultations.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation} 
                    userRole={profile?.role} 
                    onJoinMeeting={onJoinMeeting} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-4">
            {upcomingConsultations.length === 0 ? (
              <p className="text-muted-foreground">No upcoming teleconsultations scheduled.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingConsultations.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation} 
                    userRole={profile?.role} 
                    onJoinMeeting={onJoinMeeting} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-4">
            {pendingConsultations.length === 0 ? (
              <p className="text-muted-foreground">No pending teleconsultation requests.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingConsultations.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation} 
                    userRole={profile?.role} 
                    onJoinMeeting={onJoinMeeting} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-4">
            {pastConsultations.length === 0 ? (
              <p className="text-muted-foreground">No past teleconsultations.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pastConsultations.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation} 
                    userRole={profile?.role} 
                    onJoinMeeting={onJoinMeeting} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-4">
            {cancelledConsultations.length === 0 ? (
              <p className="text-muted-foreground">No cancelled teleconsultations.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cancelledConsultations.map(consultation => (
                  <ConsultationCard 
                    key={consultation.id} 
                    consultation={consultation} 
                    userRole={profile?.role} 
                    onJoinMeeting={onJoinMeeting} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface ConsultationCardProps {
  consultation: Teleconsultation;
  userRole?: string;
  onJoinMeeting: (consultation: Teleconsultation) => void;
}

const ConsultationCard: React.FC<ConsultationCardProps> = ({ 
  consultation, 
  userRole,
  onJoinMeeting 
}) => {
  const isDoctor = userRole === 'doctor';
  const startTime = new Date(consultation.start_time);
  const endTime = new Date(consultation.end_time);
  const isPastConsultation = isPast(endTime);
  const isTodayConsultation = isToday(startTime);
  const canJoin = isTodayConsultation && 
                  !isPastConsultation && 
                  consultation.status === 'confirmed';
                  
  const formattedDate = format(startTime, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startTime, 'h:mm a');
  const formattedEndTime = format(endTime, 'h:mm a');
  
  // Get the name safely with a fallback
  const consultationWithName = isDoctor ? 
    consultation.patient?.full_name || 'Patient' : 
    consultation.doctor?.full_name || 'Doctor';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{consultation.reason || 'Teleconsultation'}</CardTitle>
            <CardDescription className="mt-1 flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" /> {formattedDate}
            </CardDescription>
          </div>
          
          <StatusBadge status={consultation.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {formattedStartTime} - {formattedEndTime}
            </span>
          </div>
          
          <div className="flex items-center">
            <Video className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              With {consultationWithName}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 flex justify-end">
        {canJoin && (
          <Button onClick={() => onJoinMeeting(consultation)}>
            Join Meeting
          </Button>
        )}
        
        {consultation.status === 'pending' && (
          <div className="flex gap-2">
            <Button variant="outline">Decline</Button>
            <Button>Accept</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };
  
  return (
    <Badge variant={getVariant()}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default TeleconsultationList;


import React, { useState, useEffect } from 'react';
import { format, isPast, isToday, addMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, X, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  doctor?: {
    full_name: string;
    email: string;
  };
}

interface TeleconsultationListProps {
  onJoinMeeting: (consultation: Teleconsultation) => void;
}

const TeleconsultationList: React.FC<TeleconsultationListProps> = ({ onJoinMeeting }) => {
  const { userRole, profile } = useAuth();
  const [consultations, setConsultations] = useState<Teleconsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchConsultations();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('teleconsultations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teleconsultations'
      }, () => {
        fetchConsultations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, profile?.id]);

  const fetchConsultations = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('teleconsultations')
        .select(`
          *,
          patient:patient_id(full_name, email),
          doctor:doctor_id(full_name, email)
        `);

      // Filter based on user role
      if (userRole === 'patient') {
        query = query.eq('patient_id', profile.id);
      } else if (userRole === 'doctor') {
        query = query.eq('doctor_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching teleconsultations:', error);
      toast({
        title: "Failed to load consultations",
        description: "There was an error loading your teleconsultations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('teleconsultations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setConsultations(prev => 
        prev.map(consultation => 
          consultation.id === id 
            ? { ...consultation, status: newStatus } 
            : consultation
        )
      );

      const consultation = consultations.find(c => c.id === id);
      if (!consultation) return;

      // Create notification based on the status change
      let notificationData = {
        user_id: userRole === 'doctor' ? consultation.patient_id : consultation.doctor_id,
        title: '',
        message: '',
        type: 'teleconsultation_update',
        link: '/dashboard?view=teleconsultations'
      };

      if (newStatus === 'confirmed') {
        notificationData.title = 'Teleconsultation Confirmed';
        notificationData.message = `Your teleconsultation on ${format(new Date(consultation.start_time), 'PPP')} at ${format(new Date(consultation.start_time), 'p')} has been confirmed.`;
      } else if (newStatus === 'cancelled') {
        notificationData.title = 'Teleconsultation Cancelled';
        notificationData.message = `The teleconsultation on ${format(new Date(consultation.start_time), 'PPP')} at ${format(new Date(consultation.start_time), 'p')} has been cancelled.`;
      }

      await supabase.from('notifications').insert(notificationData);

      toast({
        title: `Consultation ${newStatus}`,
        description: `The teleconsultation has been ${newStatus}.`
      });
    } catch (error) {
      console.error(`Error ${newStatus} consultation:`, error);
      toast({
        title: "Action failed",
        description: `Failed to ${newStatus} the consultation. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, startTime: string) => {
    const isPastConsultation = isPast(new Date(startTime));
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        if (isPastConsultation) {
          return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
        }
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canJoinMeeting = (consultation: Teleconsultation) => {
    const now = new Date();
    const startTime = new Date(consultation.start_time);
    const endTime = new Date(consultation.end_time);
    
    // Can join if consultation is confirmed and time is within 5 minutes before start to end time
    const joinWindow = addMinutes(startTime, -5); // 5 minutes before start
    
    return (
      consultation.status === 'confirmed' && 
      (isAfterOrEqual(now, joinWindow) && isBeforeOrEqual(now, endTime))
    );
  };

  // Helper functions for time comparison
  const isAfterOrEqual = (date1: Date, date2: Date) => {
    return date1 >= date2;
  };

  const isBeforeOrEqual = (date1: Date, date2: Date) => {
    return date1 <= date2;
  };

  const sortedConsultations = [...consultations].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  const upcomingConsultations = sortedConsultations.filter(
    consultation => !isPast(new Date(consultation.end_time)) || consultation.status === 'pending'
  );
  
  const pastConsultations = sortedConsultations.filter(
    consultation => isPast(new Date(consultation.end_time)) && consultation.status !== 'pending'
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcomingConsultations.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastConsultations.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingConsultations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No upcoming teleconsultations found.</p>
              </CardContent>
            </Card>
          ) : (
            upcomingConsultations.map(consultation => (
              <Card key={consultation.id} className={`
                ${consultation.status === 'cancelled' ? 'opacity-60' : ''}
                ${isToday(new Date(consultation.start_time)) && consultation.status === 'confirmed' ? 'border-green-300' : ''}
              `}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {userRole === 'doctor' 
                          ? `Consultation with ${consultation.patient?.full_name}`
                          : `Consultation with Dr. ${consultation.doctor?.full_name}`}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" /> 
                        {format(new Date(consultation.start_time), 'PPP')}
                        <Clock className="h-4 w-4 ml-3 mr-1" /> 
                        {format(new Date(consultation.start_time), 'p')} - {format(new Date(consultation.end_time), 'p')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(consultation.status, consultation.start_time)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <strong>Reason:</strong> {consultation.reason || 'General consultation'}
                  </div>
                  
                  {isToday(new Date(consultation.start_time)) && consultation.status === 'confirmed' && (
                    <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      This consultation is scheduled for today!
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {canJoinMeeting(consultation) && (
                    <Button 
                      onClick={() => onJoinMeeting(consultation)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Video className="h-4 w-4 mr-2" /> Join Meeting
                    </Button>
                  )}
                  
                  {userRole === 'doctor' && consultation.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-green-600 border-green-200 hover:border-green-300 hover:bg-green-50"
                        onClick={() => handleStatusChange(consultation.id, 'confirmed')}
                      >
                        <Check className="h-4 w-4 mr-2" /> Confirm
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => handleStatusChange(consultation.id, 'cancelled')}
                      >
                        <X className="h-4 w-4 mr-2" /> Decline
                      </Button>
                    </>
                  )}

                  {userRole === 'patient' && consultation.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                      onClick={() => handleStatusChange(consultation.id, 'cancelled')}
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel Request
                    </Button>
                  )}

                  {consultation.status === 'confirmed' && !canJoinMeeting(consultation) && !isPast(new Date(consultation.end_time)) && (
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
                      onClick={() => handleStatusChange(consultation.id, 'cancelled')}
                    >
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {pastConsultations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No past teleconsultations found.</p>
              </CardContent>
            </Card>
          ) : (
            pastConsultations.map(consultation => (
              <Card key={consultation.id} className="opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {userRole === 'doctor' 
                          ? `Consultation with ${consultation.patient?.full_name}`
                          : `Consultation with Dr. ${consultation.doctor?.full_name}`}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" /> 
                        {format(new Date(consultation.start_time), 'PPP')}
                        <Clock className="h-4 w-4 ml-3 mr-1" /> 
                        {format(new Date(consultation.start_time), 'p')} - {format(new Date(consultation.end_time), 'p')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(consultation.status, consultation.start_time)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <strong>Reason:</strong> {consultation.reason || 'General consultation'}
                  </div>
                </CardContent>
                {userRole === 'doctor' && consultation.status === 'confirmed' && (
                  <CardFooter>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(consultation.id, 'completed')}
                    >
                      Mark as Completed
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeleconsultationList;

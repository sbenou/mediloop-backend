
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Clock, Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Teleconsultation } from "@/types/supabase";
import StatusBadge from "./StatusBadge";

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
  
  // Get the name safely with fallbacks
  const consultationWithName = isDoctor 
    ? (consultation.patient && typeof consultation.patient === 'object' ? consultation.patient.full_name : null) || 'Patient'
    : (consultation.doctor && typeof consultation.doctor === 'object' ? consultation.doctor.full_name : null) || 'Doctor';

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

export default ConsultationCard;

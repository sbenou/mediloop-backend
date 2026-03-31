import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Video, Clock, Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import type { Teleconsultation } from "@/types/clinical";
import StatusBadge from "./StatusBadge";
import { patchTeleconsultationApi } from "@/services/clinicalApi";
import { toast } from "@/components/ui/use-toast";

interface ConsultationCardProps {
  consultation: Teleconsultation;
  userRole?: string;
  onJoinMeeting: (consultation: Teleconsultation) => void;
  onConsultationsChanged?: () => void;
}

const ConsultationCard: React.FC<ConsultationCardProps> = ({
  consultation,
  userRole,
  onJoinMeeting,
  onConsultationsChanged,
}) => {
  const isDoctor = userRole === "doctor";
  const [busy, setBusy] = useState(false);
  const startTime = new Date(consultation.start_time);
  const endTime = new Date(consultation.end_time);
  const isPastConsultation = isPast(endTime);
  const isTodayConsultation = isToday(startTime);
  const canJoin =
    isTodayConsultation &&
    !isPastConsultation &&
    consultation.status === "confirmed";

  const formattedDate = format(startTime, "EEEE, MMMM d, yyyy");
  const formattedStartTime = format(startTime, "h:mm a");
  const formattedEndTime = format(endTime, "h:mm a");

  const consultationWithName = isDoctor
    ? (consultation.patient &&
        typeof consultation.patient === "object"
        ? consultation.patient.full_name
        : null) || "Patient"
    : (consultation.doctor &&
        typeof consultation.doctor === "object"
        ? consultation.doctor.full_name
        : null) || "Doctor";

  const refresh = () => onConsultationsChanged?.();

  const handleStatus = async (
    status: Teleconsultation["status"],
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await patchTeleconsultationApi(consultation.id, { status });
      toast({ title: status === "cancelled" ? "Cancelled" : "Updated" });
      refresh();
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Could not update",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setBusy(false);
    }
  };

  const patientCanCancel =
    !isDoctor &&
    (consultation.status === "pending" || consultation.status === "confirmed") &&
    !isPast(endTime);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {consultation.reason || "Teleconsultation"}
            </CardTitle>
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
            <span>With {consultationWithName}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-4 flex justify-end flex-wrap gap-2">
        {canJoin && (
          <Button onClick={() => onJoinMeeting(consultation)}>
            Join Meeting
          </Button>
        )}

        {consultation.status === "pending" && isDoctor && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => handleStatus("cancelled")}
            >
              Decline
            </Button>
            <Button disabled={busy} onClick={() => handleStatus("confirmed")}>
              Confirm
            </Button>
          </div>
        )}

        {consultation.status === "pending" && !isDoctor && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => handleStatus("cancelled")}
          >
            Cancel request
          </Button>
        )}

        {patientCanCancel && consultation.status === "confirmed" && (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => handleStatus("cancelled")}
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ConsultationCard;

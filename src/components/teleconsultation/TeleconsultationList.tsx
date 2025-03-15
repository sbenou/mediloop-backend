
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Teleconsultation } from "@/types/supabase";
import { useConsultations } from "./hooks/useConsultations";
import TabContent from "./TabContent";
import EmptyState from "./EmptyState";
import ConsultationTabs from "./ConsultationTabs";
import ConsultationsLoading from "./ConsultationsLoading";

interface TeleconsultationListProps {
  onJoinMeeting: (consultation: Teleconsultation) => void;
  filterRole?: string;
}

const TeleconsultationList: React.FC<TeleconsultationListProps> = ({ 
  onJoinMeeting, 
  filterRole 
}) => {
  const { profile } = useAuth();
  
  const {
    isLoading,
    hasConnections,
    todayConsultations,
    upcomingConsultations,
    pastConsultations,
    pendingConsultations,
    cancelledConsultations
  } = useConsultations(profile?.id, filterRole);
  
  if (isLoading) {
    return <ConsultationsLoading />;
  }
  
  // Show connect with doctors message only for patients without connections
  const showConnectMessage = !hasConnections && profile?.role === 'patient';
  
  // Show empty state if no consultations and has connections
  const showEmptyState = (
    todayConsultations.length === 0 && 
    upcomingConsultations.length === 0 && 
    pastConsultations.length === 0 && 
    pendingConsultations.length === 0 &&
    cancelledConsultations.length === 0 &&
    !showConnectMessage
  );
  
  if (showConnectMessage) {
    return (
      <EmptyState
        title="Connect with Doctors"
        description="You might need to connect with a doctor first."
        buttonText="Connect with Doctors"
        buttonHref="/dashboard?view=teleconsultations&tab=scheduler"
      >
        <p>You don't have any teleconsultations yet. Connect with a doctor to schedule a teleconsultation.</p>
      </EmptyState>
    );
  }
  
  if (showEmptyState) {
    return (
      <EmptyState
        title="No Teleconsultations"
        description="You don't have any teleconsultations scheduled yet."
      >
        <p>When you have teleconsultations scheduled, they will appear here.</p>
      </EmptyState>
    );
  }
  
  const allConsultationsEmpty = (
    todayConsultations.length === 0 && 
    upcomingConsultations.length === 0 && 
    pendingConsultations.length === 0 && 
    pastConsultations.length === 0 && 
    cancelledConsultations.length === 0
  );
  
  if (allConsultationsEmpty) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <ConsultationTabs
        todayConsultations={todayConsultations}
        upcomingConsultations={upcomingConsultations}
        pendingConsultations={pendingConsultations}
        pastConsultations={pastConsultations}
        cancelledConsultations={cancelledConsultations}
        profile={profile}
        onJoinMeeting={onJoinMeeting}
      />
    </div>
  );
};

export default TeleconsultationList;

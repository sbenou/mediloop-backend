
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Teleconsultation } from "@/types/supabase";
import { useConsultations } from "./hooks/useConsultations";
import TabContent from "./TabContent";
import EmptyState from "./EmptyState";

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
        
        <TabContent
          value="today"
          consultations={todayConsultations}
          userRole={profile?.role}
          emptyMessage="No teleconsultations scheduled for today."
          onJoinMeeting={onJoinMeeting}
        />
        
        <TabContent
          value="upcoming"
          consultations={upcomingConsultations}
          userRole={profile?.role}
          emptyMessage="No upcoming teleconsultations scheduled."
          onJoinMeeting={onJoinMeeting}
        />
        
        <TabContent
          value="pending"
          consultations={pendingConsultations}
          userRole={profile?.role}
          emptyMessage="No pending teleconsultation requests."
          onJoinMeeting={onJoinMeeting}
        />
        
        <TabContent
          value="past"
          consultations={pastConsultations}
          userRole={profile?.role}
          emptyMessage="No past teleconsultations."
          onJoinMeeting={onJoinMeeting}
        />
        
        <TabContent
          value="cancelled"
          consultations={cancelledConsultations}
          userRole={profile?.role}
          emptyMessage="No cancelled teleconsultations."
          onJoinMeeting={onJoinMeeting}
        />
      </Tabs>
    </div>
  );
};

export default TeleconsultationList;

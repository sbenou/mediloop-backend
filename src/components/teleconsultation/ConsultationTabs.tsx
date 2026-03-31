
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Teleconsultation } from "@/types/clinical";
import TabContent from "./TabContent";
import type { Profile } from "@/types/domain";

interface ConsultationTabsProps {
  todayConsultations: Teleconsultation[];
  upcomingConsultations: Teleconsultation[];
  pendingConsultations: Teleconsultation[];
  pastConsultations: Teleconsultation[];
  cancelledConsultations: Teleconsultation[];
  profile?: Profile | null;
  onJoinMeeting: (consultation: Teleconsultation) => void;
  onConsultationsChanged?: () => void;
}

const ConsultationTabs: React.FC<ConsultationTabsProps> = ({
  todayConsultations,
  upcomingConsultations,
  pendingConsultations,
  pastConsultations,
  cancelledConsultations,
  profile,
  onJoinMeeting,
  onConsultationsChanged,
}) => {
  return (
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
        onConsultationsChanged={onConsultationsChanged}
      />
      
      <TabContent
        value="upcoming"
        consultations={upcomingConsultations}
        userRole={profile?.role}
        emptyMessage="No upcoming teleconsultations scheduled."
        onJoinMeeting={onJoinMeeting}
        onConsultationsChanged={onConsultationsChanged}
      />
      
      <TabContent
        value="pending"
        consultations={pendingConsultations}
        userRole={profile?.role}
        emptyMessage="No pending teleconsultation requests."
        onJoinMeeting={onJoinMeeting}
        onConsultationsChanged={onConsultationsChanged}
      />
      
      <TabContent
        value="past"
        consultations={pastConsultations}
        userRole={profile?.role}
        emptyMessage="No past teleconsultations."
        onJoinMeeting={onJoinMeeting}
        onConsultationsChanged={onConsultationsChanged}
      />
      
      <TabContent
        value="cancelled"
        consultations={cancelledConsultations}
        userRole={profile?.role}
        emptyMessage="No cancelled teleconsultations."
        onJoinMeeting={onJoinMeeting}
        onConsultationsChanged={onConsultationsChanged}
      />
    </Tabs>
  );
};

export default ConsultationTabs;

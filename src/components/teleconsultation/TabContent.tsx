
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import ConsultationCard from './ConsultationCard';
import type { Teleconsultation } from "@/types/clinical";

interface TabContentProps {
  value: string;
  consultations: Teleconsultation[];
  userRole?: string;
  emptyMessage: string;
  onJoinMeeting: (consultation: Teleconsultation) => void;
  onConsultationsChanged?: () => void;
}

const TabContent: React.FC<TabContentProps> = ({
  value,
  consultations,
  userRole,
  emptyMessage,
  onJoinMeeting,
  onConsultationsChanged,
}) => {
  return (
    <TabsContent value={value} className="mt-4">
      {consultations.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {consultations.map(consultation => (
            <ConsultationCard
              key={consultation.id}
              consultation={consultation}
              userRole={userRole}
              onJoinMeeting={onJoinMeeting}
              onConsultationsChanged={onConsultationsChanged}
            />
          ))}
        </div>
      )}
    </TabsContent>
  );
};

export default TabContent;

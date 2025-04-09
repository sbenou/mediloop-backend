
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProfessionalTeam from "@/components/professional/team/ProfessionalTeam";

interface ProfessionalTeamContentProps {
  entityId: string;
  entityType: 'doctor' | 'pharmacy';
}

const ProfessionalTeamContent: React.FC<ProfessionalTeamContentProps> = ({ 
  entityId, 
  entityType 
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <ProfessionalTeam entityId={entityId} entityType={entityType} />
    </ScrollArea>
  );
};

export default ProfessionalTeamContent;

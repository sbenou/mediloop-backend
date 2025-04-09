
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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Team</h2>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <ProfessionalTeam entityId={entityId} entityType={entityType} />
      </ScrollArea>
    </div>
  );
};

export default ProfessionalTeamContent;

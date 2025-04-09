
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";

interface PharmacyTeamContentProps {
  pharmacyId: string;
}

const PharmacyTeamContent: React.FC<PharmacyTeamContentProps> = ({ pharmacyId }) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <PharmacyTeam pharmacyId={pharmacyId} />
    </ScrollArea>
  );
};

export default PharmacyTeamContent;


import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";

interface PharmacyTeamContentProps {
  pharmacyId: string;
}

const PharmacyTeamContent: React.FC<PharmacyTeamContentProps> = ({ pharmacyId }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Team</h2>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <PharmacyTeam pharmacyId={pharmacyId} />
      </ScrollArea>
    </div>
  );
};

export default PharmacyTeamContent;

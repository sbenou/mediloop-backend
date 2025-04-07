
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";

interface PharmacyTeamContentProps {
  pharmacyId: string;
}

const PharmacyTeamContent: React.FC<PharmacyTeamContentProps> = ({ pharmacyId }) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Pharmacy Team</h3>
      </div>
      
      <PharmacyTeam pharmacyId={pharmacyId} />
    </ScrollArea>
  );
};

export default PharmacyTeamContent;

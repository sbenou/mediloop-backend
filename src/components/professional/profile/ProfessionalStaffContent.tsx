
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PharmacyStaff from "@/components/pharmacy/PharmacyStaff";

interface ProfessionalStaffContentProps {
  entityId: string;
  entityType: 'doctor' | 'pharmacy';
}

const ProfessionalStaffContent: React.FC<ProfessionalStaffContentProps> = ({ 
  entityId, 
  entityType 
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      <PharmacyStaff pharmacyId={entityId} entityType={entityType} />
    </ScrollArea>
  );
};

export default ProfessionalStaffContent;

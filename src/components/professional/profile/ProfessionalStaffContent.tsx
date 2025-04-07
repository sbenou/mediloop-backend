
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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Staff Management</h3>
      </div>
      
      <PharmacyStaff pharmacyId={entityId} entityType={entityType} />
    </ScrollArea>
  );
};

export default ProfessionalStaffContent;

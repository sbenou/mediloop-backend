import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrganizationStaff from "@/components/pharmacy/OrganizationStaff";

interface ProfessionalStaffContentProps {
  entityId: string;
  entityType: "doctor" | "pharmacy";
}

const ProfessionalStaffContent: React.FC<ProfessionalStaffContentProps> = ({
  entityId,
  entityType,
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      <OrganizationStaff pharmacyId={entityId} entityType={entityType} />
    </ScrollArea>
  );
};

export default ProfessionalStaffContent;

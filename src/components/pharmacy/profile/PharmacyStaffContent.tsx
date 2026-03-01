import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrganizationStaff from "@/components/pharmacy/OrganizationStaff";

interface PharmacyStaffContentProps {
  pharmacyId: string;
}

const PharmacyStaffContent: React.FC<PharmacyStaffContentProps> = ({
  pharmacyId,
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Staff Management</h3>
      </div>

      <OrganizationStaff pharmacyId={pharmacyId} />
    </ScrollArea>
  );
};

export default PharmacyStaffContent;

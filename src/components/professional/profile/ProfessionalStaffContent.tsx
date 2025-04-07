
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ProfessionalStaffContentProps {
  entityId: string;
  entityType: 'doctor' | 'pharmacy';
}

const ProfessionalStaffContent: React.FC<ProfessionalStaffContentProps> = ({ 
  entityId, 
  entityType 
}) => {
  const entityLabel = entityType === 'doctor' ? 'Doctor' : 'Pharmacy';
  
  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Staff Management</h3>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add {entityLabel} Staff
        </Button>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <p className="text-center text-muted-foreground">
          Staff management functionality will be implemented soon.
        </p>
        <p className="text-center text-muted-foreground mt-2">
          This will allow you to manage {entityLabel.toLowerCase()} staff and their permissions.
        </p>
      </div>
    </ScrollArea>
  );
};

export default ProfessionalStaffContent;


import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StaffMemberActionsProps {
  memberId: string;
  onView: (memberId: string) => void;
  onEdit: (memberId: string) => void;
  onTerminate: (memberId: string) => void;
}

const StaffMemberActions: React.FC<StaffMemberActionsProps> = ({ 
  memberId, 
  onView, 
  onEdit, 
  onTerminate 
}) => {
  return (
    <TooltipProvider>
      <div className="flex justify-end space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onView(memberId)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Team Member</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(memberId)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit Team Member</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-destructive hover:text-destructive/90"
              onClick={() => onTerminate(memberId)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Terminate Team Member</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default StaffMemberActions;

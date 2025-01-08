import { Button } from "@/components/ui/button";
import { Pencil, Save, Trash2, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoleActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onManagePermissions: () => void;
}

export const RoleActions = ({
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onManagePermissions,
}: RoleActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {isEditing ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSave}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save changes</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit role</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete role</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onManagePermissions}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Shield className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage permissions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
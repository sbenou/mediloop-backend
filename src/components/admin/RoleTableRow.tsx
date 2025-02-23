
import React, { forwardRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, Trash2, Shield, X } from "lucide-react";

interface RoleTableRowProps {
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  isEditing: boolean;
  editName: string;
  editDescription: string;
  onEdit: (roleId: string) => void;
  onSave: (roleId: string) => void;
  onDelete: (roleId: string) => void;
  onCancel: () => void;
  onManagePermissions: (roleId: string) => void;
  setEditName: (value: string) => void;
  setEditDescription: (value: string) => void;
}

export const RoleTableRow = forwardRef<HTMLInputElement, RoleTableRowProps>(({
  role,
  isEditing,
  editName,
  editDescription,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  onManagePermissions,
  setEditName,
  setEditDescription
}, ref) => {
  console.log('RoleTableRow render:', { isEditing, role }); // Debug log

  return (
    <TableRow key={role.id}>
      <TableCell className="text-left">
        {isEditing ? (
          <Input
            ref={ref}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="max-w-[200px]"
          />
        ) : (
          role.name
        )}
      </TableCell>
      <TableCell className="text-left">
        {isEditing ? (
          <Input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="max-w-[300px]"
          />
        ) : (
          role.description || "-"
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={() => onSave(role.id)}
                variant="outline"
                size="sm"
                title="Save"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => onEdit(role.id)}
                variant="outline"
                size="sm"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onManagePermissions(role.id)}
                variant="outline"
                size="sm"
                title="Manage Permissions"
              >
                <Shield className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            onClick={() => onDelete(role.id)}
            variant="outline"
            size="sm"
            disabled={isEditing}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

RoleTableRow.displayName = "RoleTableRow";

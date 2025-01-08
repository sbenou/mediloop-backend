import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { forwardRef, useState } from "react";
import { Role } from "@/types/role";
import { RoleActions } from "./role/RoleActions";
import { RolePermissionsDialog } from "./role/RolePermissionsDialog";
import { useRolePermissions } from "./role/useRolePermissions";

interface RoleTableRowProps {
  role: Role;
  isEditing: boolean;
  editName: string;
  editDescription: string;
  onEdit: (role: Role) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  setEditName: (name: string) => void;
  setEditDescription: (description: string) => void;
}

export const RoleTableRow = forwardRef<HTMLInputElement, RoleTableRowProps>(
  ({
    role,
    isEditing,
    editName,
    editDescription,
    onEdit,
    onSave,
    onDelete,
    setEditName,
    setEditDescription,
  }, ref) => {
    const [showPermissions, setShowPermissions] = useState(false);
    
    const {
      rolePermissions,
      isLoading,
      handlePermissionsSave,
    } = useRolePermissions(role.id, showPermissions);

    return (
      <>
        <TableRow>
          <TableCell>
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
          <TableCell>
            {isEditing ? (
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            ) : (
              role.description
            )}
          </TableCell>
          <TableCell>
            <RoleActions
              isEditing={isEditing}
              onEdit={() => onEdit(role)}
              onSave={() => onSave(role.id)}
              onDelete={() => onDelete(role.id)}
              onManagePermissions={() => setShowPermissions(true)}
            />
          </TableCell>
        </TableRow>

        {!isLoading && (
          <RolePermissionsDialog
            role={role}
            showPermissions={showPermissions}
            rolePermissions={rolePermissions}
            onClose={() => setShowPermissions(false)}
            onSave={handlePermissionsSave}
          />
        )}
      </>
    );
  }
);

RoleTableRow.displayName = "RoleTableRow";
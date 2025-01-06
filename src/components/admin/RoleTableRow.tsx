import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, Shield } from "lucide-react";
import { forwardRef, useState } from "react";
import { Role } from "@/types/role";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RolePermissions } from "./RolePermissions";

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

    const handlePermissionsSave = (permissions: string[]) => {
      // TODO: Implement saving permissions to the backend
      console.log("Saving permissions for role:", role.id, permissions);
    };

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
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Button
                  onClick={() => onSave(role.id)}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => onEdit(role)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => onDelete(role.id)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowPermissions(true)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Shield className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
          <DialogContent className="max-w-3xl">
            <RolePermissions
              roleId={role.id}
              roleName={role.name}
              initialPermissions={[]} // TODO: Get initial permissions from backend
              onSave={handlePermissionsSave}
              onClose={() => setShowPermissions(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

RoleTableRow.displayName = "RoleTableRow";
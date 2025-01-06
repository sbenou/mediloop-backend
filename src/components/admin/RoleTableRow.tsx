import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, Shield } from "lucide-react";
import { forwardRef, useState } from "react";
import { Role } from "@/types/role";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RolePermissions } from "./RolePermissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

    // Fetch role permissions
    const { data: rolePermissions = [], isLoading } = useQuery({
      queryKey: ['rolePermissions', role.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', role.id);
        
        if (error) throw error;
        return data.map(rp => rp.permission_id);
      },
      enabled: showPermissions,
    });

    const handlePermissionsSave = async (permissions: string[]) => {
      try {
        // First, delete existing permissions
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', role.id);

        if (deleteError) throw deleteError;

        // Then insert new permissions
        if (permissions.length > 0) {
          const permissionsToInsert = permissions.map(permissionId => ({
            role_id: role.id,
            permission_id: permissionId
          }));

          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(permissionsToInsert);

          if (insertError) throw insertError;
        }
      } catch (error) {
        console.error('Error saving permissions:', error);
      }
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
          <DialogContent>
            {!isLoading && (
              <RolePermissions
                roleId={role.id}
                roleName={role.name}
                initialPermissions={rolePermissions}
                onSave={handlePermissionsSave}
                onClose={() => setShowPermissions(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

RoleTableRow.displayName = "RoleTableRow";
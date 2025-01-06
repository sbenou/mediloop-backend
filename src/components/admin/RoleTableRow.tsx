import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, Shield } from "lucide-react";
import { forwardRef, useState } from "react";
import { Role } from "@/types/role";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RolePermissions } from "./RolePermissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const queryClient = useQueryClient();

    // Fetch role permissions
    const { data: rolePermissions = [], isLoading } = useQuery({
      queryKey: ['rolePermissions', role.id],
      queryFn: async () => {
        console.log('Fetching permissions for role:', role.id);
        const { data, error } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', role.id);
        
        if (error) {
          console.error('Error fetching role permissions:', error);
          throw error;
        }

        console.log('Raw data from database:', data);
        const permissions = data.map(rp => rp.permission_id);
        console.log('Processed permissions:', permissions);
        return permissions;
      },
      enabled: showPermissions,
    });

    const handlePermissionsSave = async (permissions: string[]) => {
      try {
        console.log('Starting to save permissions for role:', role.id);
        console.log('Permissions to save:', permissions);

        // First, delete existing permissions
        const { data: deletedData, error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', role.id)
          .select();

        if (deleteError) {
          console.error('Error deleting existing permissions:', deleteError);
          throw deleteError;
        }
        console.log('Successfully deleted existing permissions:', deletedData);

        // Then insert new permissions
        if (permissions.length > 0) {
          const permissionsToInsert = permissions.map(permissionId => ({
            role_id: role.id,
            permission_id: permissionId
          }));

          console.log('Inserting new permissions:', permissionsToInsert);
          const { data: insertedData, error: insertError } = await supabase
            .from('role_permissions')
            .insert(permissionsToInsert)
            .select();

          if (insertError) {
            console.error('Error inserting new permissions:', insertError);
            throw insertError;
          }
          console.log('Successfully inserted new permissions:', insertedData);
        }

        // Invalidate the query to refetch permissions
        await queryClient.invalidateQueries({ queryKey: ['rolePermissions', role.id] });
        console.log('Permissions saved successfully');
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
              <TooltipProvider>
                {isEditing ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => onSave(role.id)}
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
                        onClick={() => onEdit(role)}
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
                      onClick={() => onDelete(role.id)}
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
                      onClick={() => setShowPermissions(true)}
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
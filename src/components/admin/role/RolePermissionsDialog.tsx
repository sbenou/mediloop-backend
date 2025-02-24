
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface RolePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string | null;
  roleName: string;
}

export const RolePermissionsDialog = ({
  isOpen,
  onClose,
  roleId,
  roleName,
}: RolePermissionsDialogProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && roleId) {
      loadPermissions();
    }
  }, [isOpen, roleId]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all available permissions
      const { data: allPermissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Fetch current role permissions
      const { data: rolePermissions, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (rolePermissionsError) throw rolePermissionsError;

      setPermissions(allPermissions);
      setSelectedPermissions(rolePermissions.map(rp => rp.permission_id));
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = async (permissionId: string) => {
    try {
      if (!roleId) return;

      const isSelected = selectedPermissions.includes(permissionId);
      
      if (isSelected) {
        // Remove permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permissionId);

        if (error) throw error;
        
        setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
      } else {
        // Add permission
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: roleId, permission_id: permissionId });

        if (error) throw error;
        
        setSelectedPermissions(prev => [...prev, permissionId]);
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading permissions...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {roleName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-4">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-start space-x-3 p-2">
                <Checkbox
                  id={permission.id}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={() => handlePermissionChange(permission.id)}
                />
                <div>
                  <Label htmlFor={permission.id} className="font-medium">
                    {permission.name}
                  </Label>
                  {permission.description && (
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoutePermissionSection } from "./RoutePermissionSection";
import { availableRoutePermissions, Permission } from "./types";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RolePermissionsActions } from "./role/RolePermissionsActions";

interface RolePermissionsProps {
  roleId: string;
  roleName: string;
  initialPermissions?: string[];
  onSave: (permissions: string[]) => void;
  onClose: () => void;
}

export const RolePermissions = ({
  roleId,
  roleName,
  initialPermissions = [],
  onSave,
  onClose
}: RolePermissionsProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    console.log('RolePermissions - Initial permissions received:', initialPermissions);
    setSelectedPermissions(initialPermissions);
  }, [initialPermissions]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    console.log('Permission change:', permissionId, checked);
    setSelectedPermissions(prev => {
      if (checked) {
        return [...prev, permissionId];
      }
      return prev.filter(id => id !== permissionId);
    });
  };

  const handleRoutePermissionsChange = (routePermissions: Permission[], checked: boolean) => {
    console.log('Route permissions change:', routePermissions, checked);
    const permissionIds = routePermissions.map(p => p.id);
    setSelectedPermissions(prev => {
      if (checked) {
        const newPermissions = permissionIds.filter(id => !prev.includes(id));
        return [...prev, ...newPermissions];
      }
      return prev.filter(id => !permissionIds.includes(id));
    });
  };

  const handleSave = () => {
    console.log('Saving permissions:', selectedPermissions);
    onSave(selectedPermissions);
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Route Permissions for {roleName}
        </DialogTitle>
        <DialogDescription>
          Manage the permissions for this role by selecting or deselecting the checkboxes below.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-6">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {availableRoutePermissions.map((routePermission) => (
              <RoutePermissionSection
                key={routePermission.route}
                route={routePermission.route}
                permissions={routePermission.permissions}
                selectedPermissions={selectedPermissions}
                onRoutePermissionsChange={handleRoutePermissionsChange}
                onPermissionChange={handlePermissionChange}
              />
            ))}
          </div>
        </ScrollArea>
        <RolePermissionsActions
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    </>
  );
};
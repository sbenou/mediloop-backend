import { ScrollArea } from "@/components/ui/scroll-area";
import { RoutePermissionSection } from "./RoutePermissionSection";
import { availableRoutePermissions } from "./types";
import { RolePermissionsActions } from "./role/RolePermissionsActions";
import { RolePermissionsHeader } from "./role/RolePermissionsHeader";
import { usePermissionsManagement } from "./role/usePermissionsManagement";

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
  const {
    selectedPermissions,
    handlePermissionChange,
    handleRoutePermissionsChange
  } = usePermissionsManagement(initialPermissions);

  const handleSave = () => {
    console.log('Saving permissions:', selectedPermissions);
    onSave(selectedPermissions);
    onClose();
  };

  return (
    <>
      <RolePermissionsHeader roleName={roleName} />
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
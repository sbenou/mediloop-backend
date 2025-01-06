import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Permission } from "./types";

interface RoutePermissionSectionProps {
  route: string;
  permissions: Permission[];
  selectedPermissions: string[];
  onRoutePermissionsChange: (permissions: Permission[], checked: boolean) => void;
  onPermissionChange: (permissionId: string, checked: boolean) => void;
}

export const RoutePermissionSection = ({
  route,
  permissions,
  selectedPermissions,
  onRoutePermissionsChange,
  onPermissionChange,
}: RoutePermissionSectionProps) => {
  const isRouteFullySelected = permissions.every(permission => 
    selectedPermissions.includes(permission.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3 p-2 rounded bg-accent/30">
        <Checkbox
          id={`route-${route}`}
          checked={isRouteFullySelected}
          onCheckedChange={(checked) => 
            onRoutePermissionsChange(permissions, checked as boolean)
          }
        />
        <Label
          htmlFor={`route-${route}`}
          className="text-base font-semibold"
        >
          {route}
        </Label>
      </div>
      <div className="ml-6 space-y-3">
        {permissions.map((permission) => (
          <div key={permission.id} className="flex items-start space-x-3 p-2 rounded hover:bg-accent/50">
            <Checkbox
              id={`permission-${permission.id}`}
              checked={selectedPermissions.includes(permission.id)}
              onCheckedChange={(checked) => 
                onPermissionChange(permission.id, checked as boolean)
              }
            />
            <div className="space-y-1">
              <Label
                htmlFor={`permission-${permission.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {permission.name}
              </Label>
              <p className="text-sm text-muted-foreground">
                {permission.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
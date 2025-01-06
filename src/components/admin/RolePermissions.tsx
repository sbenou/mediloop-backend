import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RoutePermissions {
  route: string;
  permissions: Permission[];
}

// This would typically come from your backend
const availableRoutePermissions: RoutePermissions[] = [
  {
    route: "Dashboard",
    permissions: [
      {
        id: "view_dashboard",
        name: "View",
        description: "Can view the dashboard"
      },
      {
        id: "manage_dashboard",
        name: "Manage",
        description: "Can manage dashboard settings"
      }
    ]
  },
  {
    route: "Products",
    permissions: [
      {
        id: "view_products",
        name: "View",
        description: "Can view products"
      },
      {
        id: "create_products",
        name: "Create",
        description: "Can create new products"
      },
      {
        id: "edit_products",
        name: "Edit",
        description: "Can edit existing products"
      },
      {
        id: "delete_products",
        name: "Delete",
        description: "Can delete products"
      }
    ]
  },
  {
    route: "Orders",
    permissions: [
      {
        id: "view_orders",
        name: "View",
        description: "Can view orders"
      },
      {
        id: "manage_orders",
        name: "Manage",
        description: "Can manage orders"
      }
    ]
  },
  {
    route: "Prescriptions",
    permissions: [
      {
        id: "view_prescriptions",
        name: "View",
        description: "Can view prescriptions"
      },
      {
        id: "manage_prescriptions",
        name: "Manage",
        description: "Can manage prescriptions"
      }
    ]
  },
  {
    route: "Settings",
    permissions: [
      {
        id: "view_settings",
        name: "View",
        description: "Can access settings"
      },
      {
        id: "manage_settings",
        name: "Manage",
        description: "Can modify settings"
      }
    ]
  },
  {
    route: "Admin",
    permissions: [
      {
        id: "view_admin",
        name: "View",
        description: "Can access admin panel"
      },
      {
        id: "manage_roles",
        name: "Manage Roles",
        description: "Can manage roles and permissions"
      },
      {
        id: "manage_users",
        name: "Manage Users",
        description: "Can manage user accounts"
      }
    ]
  }
];

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
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissions);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      if (checked) {
        return [...prev, permissionId];
      }
      return prev.filter(id => id !== permissionId);
    });
  };

  const handleRoutePermissionsChange = (routePermissions: Permission[], checked: boolean) => {
    const permissionIds = routePermissions.map(p => p.id);
    setSelectedPermissions(prev => {
      if (checked) {
        // Add all permissions for this route that aren't already selected
        const newPermissions = permissionIds.filter(id => !prev.includes(id));
        return [...prev, ...newPermissions];
      }
      // Remove all permissions for this route
      return prev.filter(id => !permissionIds.includes(id));
    });
  };

  const isRouteFullySelected = (routePermissions: Permission[]) => {
    return routePermissions.every(permission => 
      selectedPermissions.includes(permission.id)
    );
  };

  const handleSave = () => {
    onSave(selectedPermissions);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Route Permissions for {roleName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {availableRoutePermissions.map((routePermission) => (
              <div key={routePermission.route} className="space-y-4">
                <div className="flex items-start space-x-3 p-2 rounded bg-accent/30">
                  <Checkbox
                    id={`route-${routePermission.route}`}
                    checked={isRouteFullySelected(routePermission.permissions)}
                    onCheckedChange={(checked) => 
                      handleRoutePermissionsChange(routePermission.permissions, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`route-${routePermission.route}`}
                    className="text-base font-semibold"
                  >
                    {routePermission.route}
                  </Label>
                </div>
                <div className="ml-6 space-y-3">
                  {routePermission.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-2 rounded hover:bg-accent/50">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, checked as boolean)
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
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Save Permissions
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

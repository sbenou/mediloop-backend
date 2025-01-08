import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPermissionForm } from "../AddPermissionForm";
import { availableRoutePermissions } from "../types";

export const PermissionsManagementCard = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Permissions Management</CardTitle>
        <AddPermissionForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {availableRoutePermissions.map((routePermission) => (
            <div key={routePermission.route} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{routePermission.route}</h3>
              <div className="space-y-2">
                {routePermission.permissions.map((permission) => (
                  <div key={permission.id} className="bg-accent/30 p-3 rounded-md">
                    <div className="font-medium">{permission.name}</div>
                    <div className="text-sm text-muted-foreground">{permission.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID: {permission.id}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
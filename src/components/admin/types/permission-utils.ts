import { NewPermission, RoutePermissions } from "./permission.types";
import { availableRoutePermissions } from "./permission-data";

export const addNewPermission = (newPermission: NewPermission) => {
  const existingRoute = availableRoutePermissions.find(r => r.route === newPermission.route);
  
  if (existingRoute) {
    existingRoute.permissions.push({
      id: newPermission.id,
      name: newPermission.name,
      description: newPermission.description
    });
  } else {
    availableRoutePermissions.push({
      route: newPermission.route,
      permissions: [{
        id: newPermission.id,
        name: newPermission.name,
        description: newPermission.description
      }]
    });
  }
};
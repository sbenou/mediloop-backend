import { useState, useEffect } from "react";
import { Permission } from "../types";

export const usePermissionsManagement = (initialPermissions: string[] = []) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    console.log('Initial permissions received:', initialPermissions);
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

  return {
    selectedPermissions,
    handlePermissionChange,
    handleRoutePermissionsChange
  };
};
export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RoutePermissions {
  route: string;
  permissions: Permission[];
}

export interface NewPermission {
  route: string;
  id: string;
  name: string;
  description: string;
}

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

export const availableRoutePermissions: RoutePermissions[] = [
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
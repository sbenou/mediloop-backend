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
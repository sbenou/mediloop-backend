import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
}

// This would typically come from your backend
const availablePermissions: Permission[] = [
  {
    id: "manage_users",
    name: "Manage Users",
    description: "Can create, edit, and delete user accounts"
  },
  {
    id: "manage_roles",
    name: "Manage Roles",
    description: "Can create, edit, and delete roles"
  },
  {
    id: "manage_products",
    name: "Manage Products",
    description: "Can create, edit, and delete products"
  },
  {
    id: "view_reports",
    name: "View Reports",
    description: "Can view system reports and analytics"
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

  const handleSave = () => {
    onSave(selectedPermissions);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissions for {roleName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availablePermissions.map((permission) => (
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
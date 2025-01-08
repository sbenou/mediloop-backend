import { Shield } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RolePermissionsHeaderProps {
  roleName: string;
}

export const RolePermissionsHeader = ({ roleName }: RolePermissionsHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Route Permissions for {roleName}
      </DialogTitle>
      <DialogDescription>
        Manage the permissions for this role by selecting or deselecting the checkboxes below.
      </DialogDescription>
    </DialogHeader>
  );
};
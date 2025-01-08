import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RolePermissions } from "../RolePermissions";
import { Role } from "@/types/role";

interface RolePermissionsDialogProps {
  role: Role;
  showPermissions: boolean;
  rolePermissions: string[];
  onClose: () => void;
  onSave: (permissions: string[]) => Promise<void>;
}

export const RolePermissionsDialog = ({
  role,
  showPermissions,
  rolePermissions,
  onClose,
  onSave,
}: RolePermissionsDialogProps) => {
  return (
    <Dialog open={showPermissions} onOpenChange={onClose}>
      <DialogContent>
        <RolePermissions
          roleId={role.id}
          roleName={role.name}
          initialPermissions={rolePermissions}
          onSave={onSave}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
import { Button } from "@/components/ui/button";

interface RolePermissionsActionsProps {
  onClose: () => void;
  onSave: () => void;
}

export const RolePermissionsActions = ({
  onClose,
  onSave,
}: RolePermissionsActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 mt-6">
      <Button
        onClick={onClose}
        variant="outline"
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        variant="default"
      >
        Save Permissions
      </Button>
    </div>
  );
};
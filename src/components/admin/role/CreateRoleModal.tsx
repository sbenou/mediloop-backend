import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/role";

interface CreateRoleModalProps {
  showModal: boolean;
  roles: Role[];
  newRoleName: string;
  newRoleDescription: string;
  baseRoleId: string;
  onClose: () => void;
  onCreateRole: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBaseRoleChange: (value: string) => void;
}

export const CreateRoleModal = ({
  showModal,
  roles,
  newRoleName,
  newRoleDescription,
  baseRoleId,
  onClose,
  onCreateRole,
  onNameChange,
  onDescriptionChange,
  onBaseRoleChange,
}: CreateRoleModalProps) => {
  return (
    <Dialog open={showModal} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              value={newRoleName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter role name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleDescription">Description</Label>
            <Textarea
              id="roleDescription"
              value={newRoleDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter role description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseRole">Based on Role</Label>
            <Select value={baseRoleId} onValueChange={onBaseRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a base role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreateRole}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
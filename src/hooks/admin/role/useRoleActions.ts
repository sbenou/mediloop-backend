
import { useRoleMutations } from "@/hooks/useRoleMutations";
import { Role } from "@/types/role";

interface UseRoleActionsProps {
  setIsEditing: (id: string | null) => void;
  setEditName: (name: string) => void;
  setEditDescription: (description: string) => void;
  setRoleToDelete: (id: string | null) => void;
  setTempRole: (role: Role | null) => void;
  editName: string;
  editDescription: string;
  tempRole: Role | null;
}

export const useRoleActions = ({
  setIsEditing,
  setEditName,
  setEditDescription,
  setRoleToDelete,
  setTempRole,
  editName,
  editDescription,
  tempRole,
}: UseRoleActionsProps) => {
  const { createRoleMutation, updateRoleMutation, deleteRoleMutation } = useRoleMutations();

  const handleEdit = (roleId: string) => {
    setIsEditing(roleId);
    // Find the role in tempRole or get it from the database
    const roleToEdit = tempRole?.id === roleId ? tempRole : null;
    if (roleToEdit) {
      setEditName(roleToEdit.name);
      setEditDescription(roleToEdit.description || '');
    }
  };

  const handleSave = async (id: string) => {
    if (tempRole && tempRole.id === id) {
      await createRoleMutation.mutateAsync({
        name: editName,
        description: editDescription,
      });
      setTempRole(null);
    } else {
      await updateRoleMutation.mutateAsync({
        id,
        name: editName,
        description: editDescription,
      });
    }
    setIsEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (tempRole && tempRole.id === id) {
      setTempRole(null);
      setIsEditing(null);
    } else {
      setRoleToDelete(id);
    }
  };

  const confirmDelete = async (id: string) => {
    await deleteRoleMutation.mutateAsync(id);
    setRoleToDelete(null);
  };

  return {
    handleEdit,
    handleSave,
    handleDelete,
    confirmDelete,
  };
};

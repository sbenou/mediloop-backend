
import { supabase } from "@/lib/supabase";
import { useRoleState } from "./role/useRoleState";
import { useRoleQueries } from "./role/useRoleQueries";
import { useRoleActions } from "./role/useRoleActions";

export const useRoleManagement = () => {
  const {
    isEditing,
    editName,
    editDescription,
    roleToDelete,
    tempRole,
    showCreateModal,
    newRoleName,
    newRoleDescription,
    baseRoleId,
    setIsEditing,
    setEditName,
    setEditDescription,
    setRoleToDelete,
    setTempRole,
    setShowCreateModal,
    setNewRoleName,
    setNewRoleDescription,
    setBaseRoleId,
  } = useRoleState();

  const { roles, isLoading, queryClient } = useRoleQueries();

  const { 
    handleEdit, 
    handleSave, 
    handleDelete, 
    handleCancel, 
    confirmDelete,
    handleManagePermissions 
  } = useRoleActions({
    setIsEditing,
    setEditName,
    setEditDescription,
    setRoleToDelete,
    setTempRole,
    editName,
    editDescription,
    tempRole,
  });

  const handleCreateRole = async () => {
    try {
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert([
          {
            name: newRoleName,
            description: newRoleDescription,
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      if (baseRoleId) {
        const { data: basePermissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', baseRoleId);

        if (permissionsError) throw permissionsError;

        if (basePermissions.length > 0) {
          const newPermissions = basePermissions.map(({ permission_id }) => ({
            role_id: newRole.id,
            permission_id
          }));

          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(newPermissions);

          if (insertError) throw insertError;
        }
      }

      setNewRoleName("");
      setNewRoleDescription("");
      setBaseRoleId("");
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['roles'] });

    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  return {
    roles,
    isLoading,
    isEditing,
    editName,
    editDescription,
    roleToDelete,
    tempRole,
    showCreateModal,
    newRoleName,
    newRoleDescription,
    baseRoleId,
    setEditName,
    setEditDescription,
    setShowCreateModal,
    setNewRoleName,
    setNewRoleDescription,
    setBaseRoleId,
    setRoleToDelete,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
    confirmDelete,
    handleCreateRole,
    handleManagePermissions,
  };
};

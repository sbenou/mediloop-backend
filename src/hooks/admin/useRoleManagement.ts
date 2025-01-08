import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Role } from "@/types/role";
import { useRoleMutations } from "@/hooks/useRoleMutations";

export const useRoleManagement = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [baseRoleId, setBaseRoleId] = useState<string>("");
  const queryClient = useQueryClient();
  
  const { createRoleMutation, updateRoleMutation, deleteRoleMutation } = useRoleMutations();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Role[];
    },
  });

  const handleEdit = (role: Role) => {
    setIsEditing(role.id);
    setEditName(role.name);
    setEditDescription(role.description);
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

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRoleMutation.mutateAsync(roleToDelete);
      setRoleToDelete(null);
    }
  };

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
    confirmDelete,
    handleCreateRole,
  };
};
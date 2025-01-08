import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useRolePermissions = (roleId: string, enabled: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ['rolePermissions', roleId],
    queryFn: async () => {
      console.log('Fetching permissions for role:', roleId);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
      
      if (error) {
        console.error('Error fetching role permissions:', error);
        throw error;
      }

      console.log('Raw data from database:', data);
      const permissions = data.map(rp => rp.permission_id);
      console.log('Processed permissions:', permissions);
      return permissions;
    },
    enabled,
  });

  const handlePermissionsSave = async (permissions: string[]) => {
    try {
      console.log('Starting to save permissions for role:', roleId);
      console.log('Permissions to save:', permissions);

      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .select();

      if (deleteError) {
        console.error('Error deleting existing permissions:', deleteError);
        throw deleteError;
      }

      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert)
          .select();

        if (insertError) {
          console.error('Error inserting new permissions:', insertError);
          throw insertError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['rolePermissions', roleId] });
      console.log('Permissions saved successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      throw error;
    }
  };

  return {
    rolePermissions,
    isLoading,
    handlePermissionsSave,
  };
};
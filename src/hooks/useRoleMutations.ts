import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Role } from "@/types/role";
import { useToast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";

type CreateRoleInput = Pick<Role, 'name' | 'description'>;
type UpdateRoleInput = Pick<Role, 'id' | 'name' | 'description'>;

const handlePostgrestError = (error: PostgrestError) => {
  if (error.code === '23505') {
    throw new Error('A role with this name already exists.');
  }
  throw new Error(error.message);
};

export const useRoleMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRoleMutation = useMutation({
    mutationFn: async (newRole: CreateRoleInput) => {
      const { data, error } = await supabase
        .from('roles')
        .insert([newRole])
        .select()
        .single();
      
      if (error) {
        handlePostgrestError(error);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Role added",
        description: "A new role has been added successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create role. Please try again.",
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, name, description }: UpdateRoleInput) => {
      const { data, error } = await supabase
        .from('roles')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        handlePostgrestError(error);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Role updated",
        description: "The role has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update role. Please try again.",
      });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Role deleted",
        description: "The role has been successfully deleted.",
        variant: "destructive",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete role. Please try again.",
      });
    }
  });

  return {
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation
  };
};
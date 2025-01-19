import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";
import { Role } from "@/types/role";

// Type definitions for mutation inputs
type CreateRoleInput = Pick<Role, 'name' | 'description'>;
type UpdateRoleInput = Pick<Role, 'id' | 'name' | 'description'>;

// Error handling utilities
const handlePostgrestError = (error: PostgrestError) => {
  if (error.code === '23505') {
    throw new Error('A role with this name already exists.');
  }
  throw new Error(error.message);
};

// Toast message utilities
const showSuccessToast = (toast: any, message: string) => {
  toast({
    title: message,
    description: "The operation was completed successfully.",
  });
};

const showErrorToast = (toast: any, error: Error) => {
  toast({
    variant: "destructive",
    title: "Error",
    description: error.message || "An unexpected error occurred.",
  });
};

export const useRoleMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create role mutation
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
      showSuccessToast(toast, "Role added");
    },
    onError: (error: Error) => {
      console.error('Error creating role:', error);
      showErrorToast(toast, error);
    }
  });

  // Update role mutation
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
      showSuccessToast(toast, "Role updated");
    },
    onError: (error: Error) => {
      console.error('Error updating role:', error);
      showErrorToast(toast, error);
    }
  });

  // Delete role mutation
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
      showSuccessToast(toast, "Role deleted");
    },
    onError: (error: Error) => {
      console.error('Error deleting role:', error);
      showErrorToast(toast, error);
    }
  });

  return {
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation
  };
};
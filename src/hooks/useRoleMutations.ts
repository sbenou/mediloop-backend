import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";
import { Role } from "@/types/role";

// Type definitions
type ToastFunction = typeof useToast extends () => infer R ? R : never;
type CreateRoleInput = Pick<Role, 'name' | 'description'>;
type UpdateRoleInput = Pick<Role, 'id' | 'name' | 'description'>;

// Database operations
const roleOperations = {
  create: async (newRole: CreateRoleInput) => {
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

  update: async ({ id, name, description }: UpdateRoleInput) => {
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

  delete: async (id: string) => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(error.message);
    }
  }
};

// Error handling
const handlePostgrestError = (error: PostgrestError) => {
  if (error.code === '23505') {
    throw new Error('A role with this name already exists.');
  }
  throw new Error(error.message);
};

// Toast utilities
const toastMessages = {
  success: (toast: ToastFunction, message: string) => {
    toast({
      title: message,
      description: "The operation was completed successfully.",
    });
  },
  error: (toast: ToastFunction, error: Error) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "An unexpected error occurred.",
    });
  }
};

// Main hook
export const useRoleMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRoleMutation = useMutation({
    mutationFn: roleOperations.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toastMessages.success(toast, "Role added");
    },
    onError: (error: Error) => {
      console.error('Error creating role:', error);
      toastMessages.error(toast, error);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: roleOperations.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toastMessages.success(toast, "Role updated");
    },
    onError: (error: Error) => {
      console.error('Error updating role:', error);
      toastMessages.error(toast, error);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleOperations.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toastMessages.success(toast, "Role deleted");
    },
    onError: (error: Error) => {
      console.error('Error deleting role:', error);
      toastMessages.error(toast, error);
    }
  });

  return {
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation
  };
};
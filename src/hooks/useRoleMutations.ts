import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Role } from "@/types/role";
import { useToast } from "@/hooks/use-toast";

export const useRoleMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRoleMutation = useMutation({
    mutationFn: async (newRole: Omit<Role, 'id'>) => {
      const { data, error } = await supabase
        .from('roles')
        .insert([newRole])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
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
        description: "Failed to create role. Please try again.",
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...role }: Role) => {
      const { data, error } = await supabase
        .from('roles')
        .update(role)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
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
        description: "Failed to update role. Please try again.",
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
        console.error('Supabase error:', error);
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
        description: "Failed to delete role. Please try again.",
      });
    }
  });

  return {
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation
  };
};
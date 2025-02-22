
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/user";
import { toast } from "@/components/ui/use-toast";

export const useAdminData = (userProfile: UserProfile | null) => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      console.log('Fetching users for admin page with profile:', userProfile?.id);
      
      // Check for superadmin role
      if (!userProfile || userProfile.role !== 'superadmin') {
        console.log('User is not authorized to fetch admin data');
        throw new Error('Not authorized to fetch admin data');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data?.length);
      return data || [];
    },
    enabled: Boolean(userProfile?.role === 'superadmin'),
    staleTime: 1000 * 60, // 1 minute
    retry: false, // Don't retry if unauthorized
    onError: (error) => {
      console.error('Error in useAdminData query:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin data. Please try again.",
      });
    }
  });

  const updateUserRole = async (userId: string, newRole: UserProfile['role']) => {
    try {
      console.log('Updating user role:', { userId, newRole });
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update user role. Please try again.",
        });
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      throw error;
    }
  };

  return { 
    users, 
    isLoading, 
    error,
    updateUserRole 
  };
};

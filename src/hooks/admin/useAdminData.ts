
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/user";
import { toast } from "@/components/ui/use-toast";

export const useAdminData = (userProfile: UserProfile | null) => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      console.log('Fetching users for admin page with profile:', userProfile?.id);
      if (!userProfile || userProfile.role !== 'superadmin') {
        console.log('User is not authorized to fetch admin data');
        return [];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load users. Please try again.",
        });
        throw error;
      }

      console.log('Fetched users:', data?.length);
      return data as UserProfile[];
    },
    enabled: !!userProfile && userProfile.role === 'superadmin',
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
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

      // Invalidate the users query to refetch the updated data
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

  if (error) {
    console.error('Error in useAdminData:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load admin data. Please try again.",
    });
  }

  return { 
    users, 
    isLoading, 
    error,
    updateUserRole 
  };
};

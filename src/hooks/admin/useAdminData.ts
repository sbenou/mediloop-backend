
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/user";
import { toast } from "@/components/ui/use-toast";

export const useAdminData = (userProfile: UserProfile | null) => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      console.log('Fetching users for admin page...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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

      console.log('Fetched users:', data);
      return data as UserProfile[];
    },
    enabled: userProfile?.role === 'superadmin',
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
    updateUserRole 
  };
};

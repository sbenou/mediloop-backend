import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/toaster";
import { AdminTabs } from "@/components/admin/tabs/AdminTabs";
import { useAdminData } from "@/hooks/admin/useAdminData";

const AdminSettings = () => {
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { users, isLoading, updateUserRole } = useAdminData(userProfile);

  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <AdminTabs 
        users={users}
        isLoading={isLoading}
        updateUserRole={updateUserRole}
      />
      <Toaster />
    </div>
  );
};

export default AdminSettings;
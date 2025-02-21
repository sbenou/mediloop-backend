
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import UserAvatar from "./user-menu/UserAvatar";
import UserMenuItems from "./user-menu/UserMenuItems";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

const UserMenu = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <UserMenuItems 
          userRole={userProfile?.role}
          userName={userProfile?.full_name}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;


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
import { Skeleton } from "@/components/ui/skeleton";

const UserMenu = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('Fetching user profile in UserMenu query');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log('No session found in UserMenu query');
        return null;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Profile fetch error in UserMenu:', error);
        throw error;
      }
      
      console.log('Profile fetch successful in UserMenu query:', data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Show connection button if not authenticated
  if (!isAuthenticated) {
    return (
      <a
        href="/login"
        className="text-primary hover:text-primary/80 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          console.log('Connection link clicked, navigating to login');
          window.location.replace('/login');
        }}
      >
        Connection
      </a>
    );
  }

  // Show loading skeleton while authentication or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer outline-none"
          >
            <UserAvatar />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          sideOffset={5}
          forceMount
          className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <UserMenuItems 
            userRole={userProfile?.role}
            userName={userProfile?.full_name}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;

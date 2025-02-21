
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import UserAvatar from "./user-menu/UserAvatar";
import UserMenuItems from "./user-menu/UserMenuItems";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const UserMenu = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Prefetch profile data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Prefetching profile data in UserMenu');
      queryClient.prefetchQuery({
        queryKey: ['userProfile'],
        queryFn: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) return null;
          
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          return data;
        }
      });
    }
  }, [isAuthenticated, queryClient]);

  // Show connection button if not authenticated
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

  // Show loading skeleton while authentication or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity outline-none cursor-pointer"
          aria-label="Open user menu"
        >
          <UserAvatar />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent 
          align="end" 
          sideOffset={5}
          className="w-56 bg-white border rounded-md shadow-lg z-[100] animate-in fade-in-0 zoom-in-95"
          collisionPadding={20}
        >
          <UserMenuItems 
            userRole={userProfile?.role}
            userName={userProfile?.full_name}
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};

export default UserMenu;

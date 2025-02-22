
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import UserAvatar from "./user-menu/UserAvatar";
import UserMenuItems from "./user-menu/UserMenuItems";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

const UserMenu = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refetch profile data when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Auth state changed, invalidating profile query');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  }, [isAuthenticated, queryClient]);

  const { data: userProfile, isLoading: profileLoading, error } = useQuery({
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
      
      if (!data) {
        console.log('No profile data found');
        return null;
      }
      
      console.log('Profile fetch successful in UserMenu query:', data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2
  });

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error('Query error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data. Please refresh the page.",
      });
    }
  }, [error]);

  // Show connection button if not authenticated
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => {
          console.log('Connection button clicked, navigating to login');
          navigate('/login', { replace: true });
        }}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  // Show loading skeleton while authentication or profile is loading
  if (authLoading || profileLoading) {
    console.log('Loading state:', { authLoading, profileLoading });
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  console.log('Rendering UserMenu with profile:', userProfile);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer outline-none"
          aria-label="User menu"
        >
          <UserAvatar />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={5}
        className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        <UserMenuItems 
          userRole={userProfile?.role}
          userName={userProfile?.full_name}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

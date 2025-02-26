
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export const UserMenuItems = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useRecoilState(authState);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear auth state
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  // Use useMemo to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    return (
      <>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/upgrade')}>
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/billing')}>
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/notifications')}>
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          Log out
        </DropdownMenuItem>
      </>
    );
  }, [navigate]);

  return menuItems;
};

export default UserMenuItems;

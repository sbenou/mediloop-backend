
import { useNavigate } from "react-router-dom";
import { FileText, Settings, ShoppingBag, UserCircle, Shield, LogOut } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useSetRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { useQueryClient } from "@tanstack/react-query";

interface UserMenuItemsProps {
  userRole?: string;
  userName?: string;
}

const UserMenuItems = ({ userRole, userName }: UserMenuItemsProps) => {
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      console.log('Initiating logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to log out. Please try again.",
        });
        return;
      }

      // Clear auth state explicitly
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });

      // Clear queries
      queryClient.clear();
      
      // Clear any stored session data
      localStorage.removeItem('supabase.auth.token');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      console.log('Logout successful');
      
      // Navigate to login page with replace to prevent going back
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <>
      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
        {userName || 'User'}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => handleNavigation('/my-details')}
        className="cursor-pointer"
      >
        <UserCircle className="mr-2 h-4 w-4 text-[#7E69AB]" />
        Profile
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleNavigation('/my-orders')}
        className="cursor-pointer"
      >
        <ShoppingBag className="mr-2 h-4 w-4 text-[#7E69AB]" />
        My Orders
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleNavigation('/my-prescriptions')}
        className="cursor-pointer"
      >
        <FileText className="mr-2 h-4 w-4 text-[#7E69AB]" />
        My Prescriptions
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleNavigation('/settings')}
        className="cursor-pointer"
      >
        <Settings className="mr-2 h-4 w-4 text-[#7E69AB]" />
        Settings
      </DropdownMenuItem>
      {userRole === 'superadmin' && (
        <DropdownMenuItem
          onClick={() => handleNavigation('/admin-settings')}
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4 text-[#7E69AB]" />
          Admin Settings
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={handleLogout}
        className="cursor-pointer text-destructive focus:text-destructive"
      >
        <LogOut className="mr-2 h-4 w-4 text-destructive" />
        Logout
      </DropdownMenuItem>
    </>
  );
};

export default UserMenuItems;

import { useNavigate } from "react-router-dom";
import { FileText, Settings, ShoppingBag, UserCircle, Shield, LogOut } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface UserMenuItemsProps {
  userRole?: string;
  userName?: string;
}

const UserMenuItems = ({ userRole, userName }: UserMenuItemsProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
      return;
    }
    
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <>
      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
        {userName}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => navigate('/my-details')}
        className="cursor-pointer"
      >
        <UserCircle className="mr-2 h-4 w-4" />
        My Personal Details
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigate('/my-orders')}
        className="cursor-pointer"
      >
        <ShoppingBag className="mr-2 h-4 w-4" />
        My Orders
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigate('/my-prescriptions')}
        className="cursor-pointer"
      >
        <FileText className="mr-2 h-4 w-4" />
        My Prescriptions
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigate('/settings')}
        className="cursor-pointer"
      >
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </DropdownMenuItem>
      {userRole === 'superadmin' && (
        <DropdownMenuItem
          onClick={() => navigate('/admin-settings')}
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          Admin Settings
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={handleLogout}
        className="cursor-pointer text-destructive focus:text-destructive"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </>
  );
};

export default UserMenuItems;
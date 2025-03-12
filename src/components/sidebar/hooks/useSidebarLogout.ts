
import { toast } from "@/components/ui/use-toast";
import { clearAllAuthStorage } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { clearAllCookies, broadcastAuthEvent } from "@/lib/auth/sessionUtils";

export const useSidebarLogout = () => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      console.log("Logout initiated from UnifiedSidebar");
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
      
      clearAllAuthStorage();
      clearAllCookies();
      
      try {
        localStorage.removeItem('selectedCountry');
      } catch (err) {
        console.error("Error removing selectedCountry:", err);
      }
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
      // Broadcast logout event to other tabs
      broadcastAuthEvent('LOGOUT');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Use navigate instead of directly setting window.location
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  return { handleLogout };
};

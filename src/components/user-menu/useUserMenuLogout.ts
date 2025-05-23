
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { clearAllAuthStorage } from "@/lib/supabase";
import { clearAllCookies, broadcastAuthEvent } from "@/lib/auth/sessionUtils";

// Encapsulate logout logic so the main menu stays clean and testable
export function useUserMenuLogout() {
  const [auth, setAuth] = useRecoilState(authState);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from UserMenu");
      
      // 1. Immediately clear auth state to update UI
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      
      // 2. Clear localStorage and sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.removeItem('selectedCountry');
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
      
      // 3. Clear auth storage and cookies
      clearAllAuthStorage();
      clearAllCookies();
      
      // 4. Broadcast logout event to other tabs
      broadcastAuthEvent('LOGOUT');
      
      // 5. Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
      // 6. Show success toast
      toast({ 
        title: "Logged out", 
        description: "You have been successfully logged out" 
      });
      
      // 7. Redirect to login page using window.location to ensure full page reload
      window.location.href = "/login";
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
}

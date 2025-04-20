
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { supabase, clearAllAuthStorage } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

// Encapsulate logout logic so the main menu stays clean and testable
export function useUserMenuLogout() {
  const [auth, setAuth] = useRecoilState(authState);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Immediately clear auth state
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      try {
        localStorage.removeItem('selectedCountry');
      } catch (e) {
        // optional: suppress
      }
      clearAllAuthStorage();
      try {
        const logoutEvent = { type: 'LOGOUT', timestamp: Date.now() };
        localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
      } catch {
        // ignore
      }
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast({ title: "Logged out", description: "You have been successfully logged out" });
      window.location.href = "/login";
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  return { handleLogout };
}

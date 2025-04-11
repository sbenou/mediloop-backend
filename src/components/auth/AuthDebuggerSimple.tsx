
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";

export const AuthDebuggerSimple = () => {
  const { userRole, isPharmacist, isAuthenticated, profile, user } = useAuth();
  const auth = useRecoilValue(authState);
  
  useEffect(() => {
    console.log("===================== AUTH DEBUG =====================");
    console.log("Is authenticated:", isAuthenticated);
    console.log("User role from hook:", userRole);
    console.log("User ID:", user?.id);
    console.log("Is pharmacist from hook:", isPharmacist);
    console.log("Profile data:", profile);
    console.log("Raw profile role:", auth.profile?.role);
    console.log("Profile role type:", typeof auth.profile?.role);
    console.log("Direct pharmacist check:", auth.profile?.role === 'pharmacist');
    console.log("Is profile loaded:", !!profile);
    console.log("=====================================================");
  }, [isAuthenticated, userRole, isPharmacist, profile, user, auth.profile]);
  
  // This component doesn't render anything visible
  return null;
};

export default AuthDebuggerSimple;

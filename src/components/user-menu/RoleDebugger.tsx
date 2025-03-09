
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";

/**
 * A debugging component that logs user role information to help diagnose
 * issues with conditional rendering based on roles
 */
export const RoleDebugger = () => {
  const { userRole, isPharmacist, isAuthenticated, profile } = useAuth();
  const [auth] = useRecoilState(authState);
  
  useEffect(() => {
    console.log("============= ROLE DEBUGGER INFO =============");
    console.log("Is authenticated:", isAuthenticated);
    console.log("User role from hook:", userRole);
    console.log("Is pharmacist from hook:", isPharmacist);
    console.log("Profile data from hook:", profile);
    console.log("Auth state from recoil:", auth);
    console.log("Raw profile role:", auth.profile?.role);
    console.log("Direct pharmacist check:", auth.profile?.role === 'pharmacist');
    console.log("=============================================");
  }, [isAuthenticated, userRole, isPharmacist, profile, auth]);
  
  // This component doesn't render anything visible
  return null;
};

export default RoleDebugger;

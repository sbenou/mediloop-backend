
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useRef } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { useSearchParams } from "react-router-dom";

/**
 * A debugging component that logs user role information to help diagnose
 * issues with conditional rendering based on roles
 */
export const RoleDebugger = () => {
  const { userRole, isPharmacist, isAuthenticated, profile } = useAuth();
  const [auth] = useRecoilState(authState);
  const [searchParams] = useSearchParams();
  const hasLoggedRef = useRef(false);
  
  useEffect(() => {
    // Only log once after auth is loaded
    if (!hasLoggedRef.current && auth.profile) {
      hasLoggedRef.current = true;
      
      console.log("============= ROLE DEBUGGER INFO =============");
      console.log("Current URL:", window.location.href);
      console.log("Search params:", Object.fromEntries(searchParams.entries()));
      console.log("Is authenticated:", isAuthenticated);
      console.log("User role from hook:", userRole);
      console.log("Is pharmacist from hook:", isPharmacist);
      console.log("Profile data from hook:", profile);
      console.log("Auth state from recoil:", auth);
      console.log("Raw profile role:", auth.profile?.role);
      console.log("Direct pharmacist check:", auth.profile?.role === 'pharmacist');
      console.log("Is on dashboard:", window.location.pathname.includes('/dashboard'));
      console.log("Is pharmacy view in URL:", searchParams.get('view') === 'pharmacy');
      
      // Simulation of UserMenuItems logic
      const shouldShowPharmacyLink = auth.profile?.role === 'pharmacist' || isPharmacist;
      console.log("Should show Pharmacy Profile link:", shouldShowPharmacyLink);
      
      // Check if the role is actually a string
      console.log("Role type:", typeof auth.profile?.role);
      console.log("Role strict equality check:", auth.profile?.role === 'pharmacist');
      console.log("Role toLowerCase check:", typeof auth.profile?.role === 'string' ? auth.profile.role.toLowerCase() === 'pharmacist' : false);
      
      console.log("=============================================");
    }
  }, [isAuthenticated, userRole, isPharmacist, profile, auth, searchParams]);
  
  // This component doesn't render anything visible
  return null;
};

export default RoleDebugger;

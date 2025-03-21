
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useRef } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";

/**
 * A debugging component that logs user role information to help diagnose
 * issues with conditional rendering based on roles
 */
export const RoleDebugger = () => {
  const { userRole, isPharmacist, isAuthenticated, profile } = useAuth();
  const [auth] = useRecoilState(authState);
  const hasLoggedRef = useRef(false);
  
  useEffect(() => {
    // Only log once after auth is loaded
    if (!hasLoggedRef.current && auth.profile && !auth.isLoading) {
      hasLoggedRef.current = true;
      
      console.log("============= ROLE DEBUGGER INFO =============");
      console.log("Is authenticated:", isAuthenticated);
      console.log("User role from hook:", userRole);
      console.log("Is pharmacist from hook:", isPharmacist);
      console.log("Profile data from hook:", profile);
      console.log("Auth state from recoil:", auth);
      console.log("Raw profile role:", auth.profile?.role);
      console.log("Direct pharmacist check:", auth.profile?.role === 'pharmacist');
      console.log("Direct doctor check:", auth.profile?.role === 'doctor');
      console.log("Current route:", window.location.pathname);
      
      // Simulation of UserMenuItems logic
      const shouldShowPharmacyLink = auth.profile?.role === 'pharmacist' || isPharmacist;
      const shouldShowDoctorLink = auth.profile?.role === 'doctor' || userRole === 'doctor';
      console.log("Should show Pharmacy Profile link:", shouldShowPharmacyLink);
      console.log("Should show Doctor Profile link:", shouldShowDoctorLink);
      
      // Check if the role is actually a string
      console.log("Role type:", typeof auth.profile?.role);
      console.log("Role strict equality check (pharmacist):", auth.profile?.role === 'pharmacist');
      console.log("Role strict equality check (doctor):", auth.profile?.role === 'doctor');
      console.log("Role toLowerCase check (pharmacist):", typeof auth.profile?.role === 'string' ? auth.profile.role.toLowerCase() === 'pharmacist' : false);
      console.log("Role toLowerCase check (doctor):", typeof auth.profile?.role === 'string' ? auth.profile.role.toLowerCase() === 'doctor' : false);
      
      console.log("=============================================");
    }
  }, [isAuthenticated, userRole, isPharmacist, profile, auth]);
  
  // This component doesn't render anything visible
  return null;
};

export default RoleDebugger;


import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";

/**
 * A debugging component that logs user role information to help diagnose
 * issues with conditional rendering based on roles
 */
export const RoleDebugger = () => {
  const { userRole, isPharmacist, isAuthenticated, profile } = useAuth();
  const auth = useRecoilValue(authState);
  const hasLoggedRef = useRef(false);
  
  useEffect(() => {
    // Always log on auth state changes to help with debugging
    if (auth.profile || (!auth.isLoading && hasLoggedRef.current === false)) {
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
      
      // Additional detailed auth state debugging
      console.log("Auth state loading:", auth.isLoading);
      console.log("Auth state has user:", !!auth.user);
      console.log("Auth state has profile:", !!auth.profile);
      console.log("Auth state user ID:", auth.user?.id);
      console.log("Auth state profile ID:", auth.profile?.id);
      
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
      
      // Additional debugging for session and redirects
      console.log("Internal session state:", {
        auth: {
          isLoading: auth.isLoading,
          user: auth.user ? "exists" : "null",
          profile: auth.profile ? "exists" : "null",
        }
      });
      
      console.log("=============================================");
    }
  }, [isAuthenticated, userRole, isPharmacist, profile, auth]);
  
  // This component doesn't render anything visible
  return null;
};

export default RoleDebugger;

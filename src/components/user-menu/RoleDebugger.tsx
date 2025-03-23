
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
  
  // Log essential auth state on every render
  console.log("Role Debugger render:", {
    isAuthenticated, 
    userRole,
    profileId: auth.profile?.id,
    profileRole: auth.profile?.role,
    isLoading: auth.isLoading
  });
  
  useEffect(() => {
    // Always log on auth state changes to help with debugging
    if ((auth.profile || !auth.isLoading) && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      
      console.log("============= ROLE DEBUGGER INFO =============");
      console.log("Is authenticated:", isAuthenticated);
      console.log("Is loading:", auth.isLoading);
      console.log("User role from hook:", userRole);
      console.log("Is pharmacist from hook:", isPharmacist);
      console.log("Profile data from hook:", profile);
      console.log("Auth state from recoil:", {
        user: auth.user ? "exists" : "null",
        profile: auth.profile ? "exists" : "null",
        isLoading: auth.isLoading,
        permissions: auth.permissions.length
      });
      console.log("Raw profile role:", auth.profile?.role);
      console.log("Direct pharmacist check:", auth.profile?.role === 'pharmacist');
      console.log("Direct doctor check:", auth.profile?.role === 'doctor');
      console.log("Current route:", window.location.pathname);
      
      // Print the exact user and profile objects for debugging
      console.log("Auth user object:", auth.user);
      console.log("Auth profile object:", auth.profile);
      
      // Track auth state changes with timestamps
      console.log("Auth state logged at:", new Date().toISOString());
      console.log("Auth loading:", auth.isLoading);
      console.log("User exists:", !!auth.user);
      console.log("Profile exists:", !!auth.profile);
      console.log("User ID:", auth.user?.id);
      console.log("Profile ID:", auth.profile?.id);
      console.log("Profile role:", auth.profile?.role);
      
      // Role equality checks with type information
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

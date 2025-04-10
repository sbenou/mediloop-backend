
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useRef } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

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
    if (!hasLoggedRef.current && auth.profile) {
      hasLoggedRef.current = true;
      
      console.log("============= ROLE DEBUGGER INFO [DEBUG] =============");
      console.log("Is authenticated:", isAuthenticated);
      console.log("User role from hook:", userRole);
      console.log("Is pharmacist from hook:", isPharmacist);
      console.log("Profile data from hook:", profile);
      console.log("Auth state from recoil:", auth);
      console.log("Raw profile role:", auth.profile?.role);
      console.log("Direct pharmacist check:", auth.profile?.role === 'pharmacist');
      console.log("Is on pharmacy route:", window.location.pathname.includes('/pharmacy'));
      
      // Check sessionStorage state
      console.log("SessionStorage state:", {
        login_successful: sessionStorage.getItem('login_successful'),
        skip_dashboard_redirect: sessionStorage.getItem('skip_dashboard_redirect'),
        dashboard_redirect_count: sessionStorage.getItem('dashboard_redirect_count'),
        dashboard_mount_count: sessionStorage.getItem('dashboard_mount_count'),
        pharmacy_redirect_count: sessionStorage.getItem('pharmacy_redirect_count'),
      });
      
      // Simulation of UserMenuItems logic
      const shouldShowPharmacyLink = auth.profile?.role === 'pharmacist' || isPharmacist;
      console.log("Should show Pharmacy Profile link:", shouldShowPharmacyLink);
      
      // Check if the role is actually a string
      console.log("Role type:", typeof auth.profile?.role);
      console.log("Role strict equality check:", auth.profile?.role === 'pharmacist');
      console.log("Role loose equality check:", auth.profile?.role == 'pharmacist');
      console.log("Role toLowerCase check:", typeof auth.profile?.role === 'string' ? auth.profile.role.toLowerCase() === 'pharmacist' : false);
      
      // Check expected dashboard routes
      console.log("Expected dashboard route for this user:", getDashboardRouteByRole(auth.profile?.role));
      console.log("Current URL:", window.location.href);
      console.log("URL matches expected route:", window.location.href.includes(getDashboardRouteByRole(auth.profile?.role)));
      
      // Force navigation attempt if user is a pharmacist but link isn't showing
      if (shouldShowPharmacyLink) {
        console.log("Pharmacist detected - Pharmacy Profile link SHOULD be visible");
        try {
          setTimeout(() => {
            const pharmacyLinkEl = document.querySelector('.pharmacy-profile-link');
            console.log("Pharmacy link element found after delay:", !!pharmacyLinkEl);
            console.log("Full dropdown menu items:", document.querySelectorAll('[class*="dropdown-menu"]').length);
            
            // Check current URL parameters
            const url = new URL(window.location.href);
            console.log("Current URL parameters:", {
              pathname: url.pathname,
              view: url.searchParams.get('view'),
              section: url.searchParams.get('section'),
              fullURL: url.toString()
            });
            
            // Check if we should perform a corrective action
            if (url.pathname === '/dashboard' && url.searchParams.get('view') !== 'pharmacy') {
              console.log("Detected pharmacist on incorrect dashboard view - should be /dashboard?view=pharmacy&section=dashboard");
              
              // We don't auto-correct here to avoid redirect loops, but we log it for debugging
            }
          }, 2000); // Check after a delay to allow rendering
        } catch (e) {
          console.error("Error checking for pharmacy link:", e);
        }
      }
      
      console.log("=============================================");
    }
  }, [isAuthenticated, userRole, isPharmacist, profile, auth]);
  
  // This component doesn't render anything visible
  return null;
};

export default RoleDebugger;

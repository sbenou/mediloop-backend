
import { useSearchParams } from "react-router-dom";

export const useDashboardParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get common dashboard parameters
  const view = searchParams.get("view") || "home";
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  const workplacesTab = searchParams.get("workplacesTab") || "selection"; // Added workplacesTab
  
  // Function to update dashboard parameters
  const updateParams = (newParams: Record<string, string>) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    // Update each parameter
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        updatedParams.set(key, value);
      } else {
        updatedParams.delete(key);
      }
    });
    
    setSearchParams(updatedParams);
  };

  return {
    // Current parameter values
    params: {
      view,
      section,
      profileTab,
      ordersTab,
      workplacesTab // Include workplacesTab in the returned params object
    },
    // Raw parameters
    searchParams,
    // Update functions
    setSearchParams,
    updateParams
  };
};

export default useDashboardParams;

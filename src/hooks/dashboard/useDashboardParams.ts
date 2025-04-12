
import { useSearchParams } from 'react-router-dom';

interface DashboardParams {
  view: string | null;
  section: string | null;
  profileTab: string | null;
  ordersTab: string | null;
  workplacesTab: string | null; // Added workplacesTab
  id: string | null;
}

const useDashboardParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse current parameters from URL
  const params: DashboardParams = {
    view: searchParams.get('view'),
    section: searchParams.get('section'),
    profileTab: searchParams.get('profileTab') || 'personal',
    ordersTab: searchParams.get('ordersTab') || 'pending',
    workplacesTab: searchParams.get('workplacesTab') || 'selection', // Set default to 'selection'
    id: searchParams.get('id')
  };
  
  // Add updateParams function to modify URL parameters
  const updateParams = (newParams: Partial<DashboardParams>) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    // Update or delete parameters based on provided values
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        updatedParams.delete(key);
      } else {
        updatedParams.set(key, value);
      }
    });
    
    setSearchParams(updatedParams);
  };
  
  return { params, searchParams, updateParams };
};

export default useDashboardParams;

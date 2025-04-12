
import { useSearchParams } from 'react-router-dom';

interface DashboardParams {
  view: string | null;
  section: string | null;
  profileTab: string | null;
  ordersTab: string | null;
  id: string | null;
}

const useDashboardParams = () => {
  const [searchParams] = useSearchParams();
  
  const params: DashboardParams = {
    view: searchParams.get('view'),
    section: searchParams.get('section'),
    profileTab: searchParams.get('profileTab') || 'personal',
    ordersTab: searchParams.get('ordersTab') || 'pending',
    id: searchParams.get('id')
  };
  
  return { params, searchParams };
};

export default useDashboardParams;

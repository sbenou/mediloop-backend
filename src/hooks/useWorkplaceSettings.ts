
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { Workplace, WorkplaceSelectionOptions } from '@/types/workplace';
import { toast } from '@/components/ui/use-toast';
import { 
  fetchAllWorkplaces, 
  fetchDoctorWorkplaces, 
  updatePrimaryWorkplace,
  getCurrentWorkplaceByAvailability
} from '@/services/workplaceService';

export const useWorkplaceSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [userWorkplaces, setUserWorkplaces] = useState<Workplace[]>([]);
  const [currentWorkplace, setCurrentWorkplace] = useState<Workplace | null>(null);
  const [primaryWorkplaceId, setPrimaryWorkplaceId] = useState<string | null>(null);
  const [useMultipleWorkplaces, setUseMultipleWorkplaces] = useState(false);
  const [additionalWorkplaceIds, setAdditionalWorkplaceIds] = useState<string[]>([]);

  // Fetch all available workplaces
  const fetchWorkplaces = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Get all workplaces
      const allWorkplaces = await fetchAllWorkplaces();
      setWorkplaces(allWorkplaces);
      
      // Get doctor's workplaces
      const doctorWorkplaces = await fetchDoctorWorkplaces(user.id);
      setUserWorkplaces(doctorWorkplaces);
      
      // Find primary workplace
      const primary = doctorWorkplaces.find(w => w.is_primary);
      if (primary) {
        setPrimaryWorkplaceId(primary.id);
      }
      
      // Set additional workplace IDs
      setAdditionalWorkplaceIds(doctorWorkplaces.filter(w => !w.is_primary).map(w => w.id));
      
      // Set multiple workplaces flag
      setUseMultipleWorkplaces(doctorWorkplaces.length > 1);
      
      // Determine current workplace based on availability
      const currentByAvailability = await getCurrentWorkplaceByAvailability(user.id);
      setCurrentWorkplace(currentByAvailability || primary || null);
      
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load workplaces."
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Update primary workplace using the service function
  const handleUpdatePrimaryWorkplace = async (workplaceId: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await updatePrimaryWorkplace(user.id, workplaceId);
      
      if (success) {
        setPrimaryWorkplaceId(workplaceId);
        await fetchWorkplaces(); // Refresh data
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating workplace:', error);
      return false;
    }
  };

  // Toggle multiple workplaces setting
  const toggleMultipleWorkplaces = (enabled: boolean) => {
    setUseMultipleWorkplaces(enabled);
  };

  // Load data on component mount
  useEffect(() => {
    fetchWorkplaces();
  }, [fetchWorkplaces]);

  return {
    isLoading,
    workplaces,
    userWorkplaces,
    currentWorkplace,
    primaryWorkplaceId,
    useMultipleWorkplaces,
    additionalWorkplaceIds,
    updatePrimaryWorkplace: handleUpdatePrimaryWorkplace,
    toggleMultipleWorkplaces,
    refreshData: fetchWorkplaces
  };
};

export default useWorkplaceSettings;


import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { Workplace, WorkplaceSelectionOptions } from '@/types/workplace';
import { toast } from '@/hooks/use-toast';
import { fetchAllWorkplaces, updatePrimaryWorkplace } from '@/services/workplaceService';
import { supabase } from '@/lib/supabase';

export const useWorkplaceSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);
  const [useMultipleWorkplaces, setUseMultipleWorkplaces] = useState(false);
  const [additionalWorkplaceIds, setAdditionalWorkplaceIds] = useState<string[]>([]);

  // Fetch all available workplaces
  const fetchWorkplaces = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Use the service function instead of direct query
      const data = await fetchAllWorkplaces();
      setWorkplaces(data);
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

  // Fetch current workplace settings
  const fetchCurrentWorkplaceSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch primary workplace
      const { data: primaryWorkplaceData } = await supabase
        .from('doctor_workplaces')
        .select('workplace_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (primaryWorkplaceData?.workplace_id) {
        setSelectedWorkplaceId(primaryWorkplaceData.workplace_id);
      }

      // In the future, fetch additional workplaces and multiple workplaces setting
      // For now, we'll just set defaults
      setUseMultipleWorkplaces(false);
      setAdditionalWorkplaceIds([]);
    } catch (error) {
      console.error('Error fetching workplace settings:', error);
    }
  }, [user?.id]);

  // Update primary workplace using the service function
  const handleUpdatePrimaryWorkplace = async (workplaceId: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await updatePrimaryWorkplace(user.id, workplaceId);
      
      if (success) {
        setSelectedWorkplaceId(workplaceId);
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
    // In the future, save this preference to the database
  };

  // Load data on component mount
  useEffect(() => {
    fetchWorkplaces();
    fetchCurrentWorkplaceSettings();
  }, [fetchWorkplaces, fetchCurrentWorkplaceSettings]);

  return {
    isLoading,
    workplaces,
    selectedWorkplaceId,
    useMultipleWorkplaces,
    additionalWorkplaceIds,
    updatePrimaryWorkplace: handleUpdatePrimaryWorkplace,
    toggleMultipleWorkplaces,
    refreshData: () => {
      fetchWorkplaces();
      fetchCurrentWorkplaceSettings();
    }
  };
};

export default useWorkplaceSettings;

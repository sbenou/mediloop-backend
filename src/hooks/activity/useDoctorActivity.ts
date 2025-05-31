
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/auth/useAuth';
import { sendDoctorConnectionNotification } from '@/utils/notificationHelpers';

export function useDoctorActivity() {
  const logDoctorView = useCallback(async (doctorId: string) => {
    try {
      const { error } = await supabase.from('activities').insert([
        {
          type: 'doctor_view',
          title: 'Doctor Profile Viewed',
          description: `Viewed doctor profile ${doctorId}`,
          meta: { doctor_id: doctorId, source: 'doctor_finder' }
        }
      ]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging doctor view:', error);
    }
  }, []);

  const logDoctorSearch = useCallback(async (searchParams: {
    lat?: number;
    lon?: number;
    radius?: number;
    term?: string;
  }) => {
    try {
      const { error } = await supabase.from('activities').insert([
        {
          type: 'doctor_search',
          title: 'Doctor Search Performed',
          description: 'Searched for doctors',
          meta: { ...searchParams, source: 'doctor_finder' }
        }
      ]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging doctor search:', error);
    }
  }, []);

  return {
    logDoctorView,
    logDoctorSearch
  };
}

export function useDoctorConnections() {
  const { profile } = useAuth();
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['doctor-connections'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('doctor_patient_connections')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching doctor connections:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const requestConnection = useCallback(async (doctorId: string) => {
    if (!profile) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to request a connection.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const { error } = await supabase.from('doctor_patient_connections').insert([
        { doctor_id: doctorId, patient_id: profile.id, status: 'pending' }
      ]);
      
      if (error) throw error;
      
      // Send notification to doctor
      await sendDoctorConnectionNotification(doctorId, profile.full_name || "A patient");
      
      toast({
        title: "Connection Requested",
        description: "Your connection request has been sent to the doctor.",
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting doctor connection:', error);
      
      toast({
        title: "Connection Failed",
        description: "Failed to request a connection. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [profile]);

  return {
    connections,
    isLoading,
    requestConnection
  };
}

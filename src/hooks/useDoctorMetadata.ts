
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface DoctorMetadata {
  id: string;
  doctor_id: string;
  hours: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  logo_url: string | null;
}

export const useDoctorMetadata = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: ['doctor-metadata', doctorId],
    queryFn: async (): Promise<DoctorMetadata | null> => {
      if (!doctorId) return null;
      
      const { data, error } = await supabase
        .from('doctor_metadata')
        .select('*')
        .eq('doctor_id', doctorId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching doctor metadata:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

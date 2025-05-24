
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface PharmacyMetadata {
  id: string;
  pharmacy_id: string;
  logo_url: string | null;
}

export const usePharmacyMetadata = (pharmacyId: string | undefined) => {
  return useQuery({
    queryKey: ['pharmacy-metadata', pharmacyId],
    queryFn: async (): Promise<PharmacyMetadata | null> => {
      if (!pharmacyId) return null;
      
      const { data, error } = await supabase
        .from('pharmacy_metadata')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching pharmacy metadata:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!pharmacyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

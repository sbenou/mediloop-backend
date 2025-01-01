import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import PharmacyCard from "@/components/PharmacyCard";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  distance: string;
}

const PharmacySelection = () => {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const { data: pharmacies } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*');
      
      if (error) {
        console.error('Error fetching pharmacies:', error);
        return [];
      }
      
      return data || [];
    },
  });

  const { data: defaultPharmacy } = useQuery({
    queryKey: ['defaultPharmacy'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      try {
        const { data: userPharmacy, error: userPharmacyError } = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (userPharmacyError) {
          console.error('Error fetching user pharmacy:', userPharmacyError);
          return null;
        }
        
        if (!userPharmacy) return null;
        
        const { data: pharmacy, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', userPharmacy.pharmacy_id)
          .single();
        
        if (pharmacyError) {
          console.error('Error fetching pharmacy details:', pharmacyError);
          return null;
        }
        
        return pharmacy;
      } catch (error) {
        console.error('Database error:', error);
        return null;
      }
    },
    enabled: !!session?.user?.id,
  });

  const setDefaultPharmacyMutation = useMutation({
    mutationFn: async (pharmacyId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      // First check if the pharmacy exists
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('id', pharmacyId)
        .single();

      if (pharmacyError || !pharmacy) {
        throw new Error('Selected pharmacy does not exist in the database');
      }

      try {
        // Delete existing default pharmacy if any
        await supabase
          .from('user_pharmacies')
          .delete()
          .eq('user_id', session.user.id);

        // Set new default pharmacy
        const { error } = await supabase
          .from('user_pharmacies')
          .insert([
            { user_id: session.user.id, pharmacy_id: pharmacyId }
          ]);

        if (error) {
          console.error('Error setting default pharmacy:', error);
          throw error;
        }
      } catch (error) {
        console.error('Database error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaultPharmacy'] });
      toast({
        title: "Default Pharmacy Updated",
        description: "Your default pharmacy has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to update default pharmacy. Please ensure the pharmacy exists in our system.",
        variant: "destructive",
      });
    },
  });

  // Use actual pharmacies from the database instead of mock data
  const availablePharmacies: Pharmacy[] = pharmacies?.map(pharmacy => ({
    ...pharmacy,
    distance: "N/A" // Distance calculation would be implemented separately
  })) || [];

  if (!session?.user?.id) {
    return <div>Please log in to select a default pharmacy.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Default Pharmacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availablePharmacies.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            {...pharmacy}
            onSelect={() => setDefaultPharmacyMutation.mutate(pharmacy.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default PharmacySelection;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
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

  const { data: defaultPharmacy } = useQuery({
    queryKey: ['defaultPharmacy'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      // First, get the user's pharmacy selection
      const { data: userPharmacy, error: userPharmacyError } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (userPharmacyError && userPharmacyError.code !== 'PGRST116') throw userPharmacyError;
      
      if (!userPharmacy) return null;
      
      // Then, get the pharmacy details
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', userPharmacy.pharmacy_id)
        .single();
      
      if (pharmacyError) throw pharmacyError;
      return pharmacy;
    },
    enabled: !!session?.user?.id,
  });

  const setDefaultPharmacyMutation = useMutation({
    mutationFn: async (pharmacyId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaultPharmacy'] });
      toast({
        title: "Default Pharmacy Updated",
        description: "Your default pharmacy has been updated successfully.",
      });
    },
  });

  // Mock pharmacy data (replace with real API call in production)
  const mockPharmacies: Pharmacy[] = [
    {
      id: "1",
      name: "City Pharmacy",
      address: "123 Main St",
      hours: "9 AM - 9 PM",
      phone: "(555) 123-4567",
      distance: "0.5 miles"
    },
    {
      id: "2",
      name: "Health Plus Pharmacy",
      address: "456 Oak Ave",
      hours: "8 AM - 10 PM",
      phone: "(555) 987-6543",
      distance: "1.2 miles"
    }
  ];

  if (!session?.user?.id) {
    return <div>Please log in to select a default pharmacy.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Default Pharmacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockPharmacies.map((pharmacy) => (
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
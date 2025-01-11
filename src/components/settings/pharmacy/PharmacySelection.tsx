import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import DefaultPharmacyDisplay from "./DefaultPharmacyDisplay";

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

  const { data: defaultPharmacy, isLoading } = useQuery({
    queryKey: ['defaultPharmacy', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data: userPharmacy, error: userPharmacyError } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (userPharmacyError) {
        console.error('Error fetching user pharmacy:', userPharmacyError);
        return null;
      }
      
      if (!userPharmacy?.pharmacy_id) return null;
      
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
    },
    enabled: !!session?.user?.id,
  });

  const setDefaultPharmacyMutation = useMutation({
    mutationFn: async (pharmacyId: string | null) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      try {
        await supabase
          .from('user_pharmacies')
          .delete()
          .eq('user_id', session.user.id);

        if (pharmacyId) {
          const { error } = await supabase
            .from('user_pharmacies')
            .insert([
              { user_id: session.user.id, pharmacy_id: pharmacyId }
            ]);

          if (error) throw error;
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
        description: "Failed to update default pharmacy. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!session?.user?.id) {
    return <div>Please log in to select a default pharmacy.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Pharmacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <DefaultPharmacyDisplay
            pharmacy={defaultPharmacy}
            onSetDefault={(id, isDefault) => {
              if (!isDefault) {
                setDefaultPharmacyMutation.mutate(null);
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PharmacySelection;
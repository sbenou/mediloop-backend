
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PharmacyCard from "@/components/PharmacyCard";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  email?: string;
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

  const { data: defaultPharmacy, isLoading } = useQuery({
    queryKey: ['defaultPharmacy', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      // First get the default pharmacy ID
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
      
      // Then get the pharmacy details
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
        // Delete existing default pharmacy if any
        await supabase
          .from('user_pharmacies')
          .delete()
          .eq('user_id', session.user.id);

        if (pharmacyId) {
          // Set new default pharmacy
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
        ) : defaultPharmacy ? (
          <div className="space-y-4">
            <PharmacyCard
              {...defaultPharmacy}
              onSelect={() => {}}
              onSetDefault={(id, isDefault) => {
                if (!isDefault) {
                  setDefaultPharmacyMutation.mutate(null);
                }
              }}
              isDefault={true}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">No default pharmacy selected</p>
            <Button asChild>
              <Link to="/search-pharmacy">Add a default pharmacy</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PharmacySelection;

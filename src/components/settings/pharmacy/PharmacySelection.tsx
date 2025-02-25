
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PharmacySelectionProps {
  userId?: string;
  redirectAfterSelection?: boolean;
  onComplete?: () => void;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone?: string;
  hours?: string;
}

interface LocationState {
  isNewSignup?: boolean;
  userId?: string;
  userRole?: string;
}

const PharmacySelection = ({ userId, redirectAfterSelection = false, onComplete }: PharmacySelectionProps) => {
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locationState = location.state as LocationState || {};
  
  // If userId is not passed directly, try to get it from location state (useful for redirects)
  const effectiveUserId = userId || locationState.userId;
  const isPharmacistSignup = locationState.isNewSignup && locationState.userRole === 'pharmacist';
  
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  // Fetch pharmacies (would be filtered by country in a real implementation)
  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation to set a user's pharmacy
  const setPharmacyMutation = useMutation({
    mutationFn: async (pharmacyId: string) => {
      const targetUserId = effectiveUserId || session?.user?.id;
      if (!targetUserId) throw new Error('No user ID available');

      const { error } = await supabase
        .from('user_pharmacies')
        .upsert([
          { user_id: targetUserId, pharmacy_id: pharmacyId }
        ]);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPharmacy'] });
      toast({
        title: "Pharmacy Selected",
        description: "Your pharmacy has been set successfully.",
      });
      
      if (onComplete) {
        onComplete();
      } else if (redirectAfterSelection || isPharmacistSignup) {
        navigate('/');
      }
    },
    onError: (error) => {
      console.error('Error setting pharmacy:', error);
      toast({
        title: "Error",
        description: "Failed to set your pharmacy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectPharmacy = (pharmacyId: string) => {
    setSelectedPharmacyId(pharmacyId);
  };

  const handleConfirmSelection = () => {
    if (selectedPharmacyId) {
      setPharmacyMutation.mutate(selectedPharmacyId);
    } else {
      toast({
        title: "No Selection",
        description: "Please select a pharmacy first.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mx-auto">
      <CardHeader>
        <CardTitle>Select Your Pharmacy</CardTitle>
        <CardDescription>
          Please select the pharmacy you work at from the list below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading pharmacies...</div>
        ) : (
          <div className="space-y-4">
            {pharmacies && pharmacies.length > 0 ? (
              <div className="grid gap-4">
                {pharmacies.map(pharmacy => (
                  <div 
                    key={pharmacy.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      selectedPharmacyId === pharmacy.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelectPharmacy(pharmacy.id)}
                  >
                    <h3 className="font-medium">{pharmacy.name}</h3>
                    <p className="text-sm text-muted-foreground">{pharmacy.address}, {pharmacy.city}</p>
                    {pharmacy.phone && <p className="text-sm">{pharmacy.phone}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No pharmacies found. Please contact support.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={() => {
          if (onComplete) onComplete();
          else navigate('/');
        }}>
          Skip for now
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          disabled={!selectedPharmacyId || setPharmacyMutation.isPending}
        >
          {setPharmacyMutation.isPending ? "Saving..." : "Confirm Selection"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PharmacySelection;

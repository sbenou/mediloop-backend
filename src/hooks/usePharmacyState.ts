import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export const LUXEMBOURG_COORDINATES = {
  lat: 49.6116,
  lon: 6.1319
};

export const usePharmacyState = (session: any) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: defaultPharmacy } = useQuery({
    queryKey: ['defaultPharmacy', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', session.user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.pharmacy_id || null;
    },
    enabled: !!session?.user?.id,
  });

  const handlePharmacySelect = async (pharmacyId: string) => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to order from this pharmacy.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `/products/${pharmacyId}`;
  };

  const handleSetDefaultPharmacy = async (pharmacyId: string, isDefault: boolean) => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to set a default pharmacy.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isDefault) {
        await supabase
          .from('user_pharmacies')
          .upsert({ user_id: session.user.id, pharmacy_id: pharmacyId });
        
        toast({
          title: "Success",
          description: "Default pharmacy has been set.",
        });
      } else {
        await supabase
          .from('user_pharmacies')
          .delete()
          .eq('user_id', session.user.id)
          .eq('pharmacy_id', pharmacyId);
          
        toast({
          title: "Success",
          description: "Default pharmacy has been removed.",
        });
      }
    } catch (error) {
      console.error('Error setting default pharmacy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update default pharmacy. Please try again.",
      });
    }
  };

  return {
    userLocation,
    setUserLocation,
    userProfile,
    defaultPharmacy,
    handlePharmacySelect,
    handleSetDefaultPharmacy
  };
};
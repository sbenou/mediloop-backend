import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProfileForm } from "./profile/ProfileForm";
import { ProfileDisplay } from "./profile/ProfileDisplay";
import { DefaultAddress } from "./profile/DefaultAddress";
import { toast } from "@/components/ui/use-toast";
import CNSCardScanner from "./CNSCardScanner";

const PersonalDetails = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      console.log('Profile data:', profileData); // Added for debugging
      return profileData;
    }
  });

  const handleScanComplete = async (frontImage: string, backImage: string, cardNumber: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No user found",
      });
      return;
    }

    console.log('Updating CNS card info:', { frontImage, backImage, cardNumber }); // Added for debugging

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        cns_card_front: frontImage,
        cns_card_back: backImage,
        cns_number: cardNumber,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError); // Added for debugging
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update CNS card information",
      });
      return;
    }

    // Invalidate and refetch profile data
    await queryClient.invalidateQueries({ queryKey: ['profile'] });

    toast({
      title: "Success",
      description: "CNS card information updated successfully",
    });
    setIsScanning(false);
  };

  if (error) {
    console.error('Profile error:', error); // Added for debugging
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load profile data",
    });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const initialFormData = {
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    date_of_birth: profile?.date_of_birth ? new Date(profile.date_of_birth) : null,
  };

  return (
    <div className="space-y-8">
      {isEditing ? (
        <ProfileForm
          initialData={initialFormData}
          onCancel={() => setIsEditing(false)}
          profile={profile}
        />
      ) : (
        <>
          <ProfileDisplay
            profile={profile}
            onEdit={() => setIsEditing(true)}
            onScanCNS={() => setIsScanning(true)}
          />
          <DefaultAddress />
        </>
      )}

      {isScanning && (
        <CNSCardScanner
          onClose={() => setIsScanning(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
};

export default PersonalDetails;
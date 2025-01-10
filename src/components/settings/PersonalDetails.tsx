import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CNSCardScanner from "./CNSCardScanner";
import CNSCardDisplay from "./CNSCardDisplay";
import { format } from "date-fns";

const PersonalDetails = () => {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // First get the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;

      // Then get the default address separately
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (addressError) throw addressError;
      
      return {
        ...profileData,
        address: addressData
      };
    }
  });

  const [showScanner, setShowScanner] = useState(false);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium">Personal Information</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <p className="mt-1">{profile.full_name}</p>
            </div>
            {profile.date_of_birth && (
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <p className="mt-1">{format(new Date(profile.date_of_birth), 'PP')}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Default Address</h3>
          {profile.address && (
            <div className="mt-4 p-4 border rounded-lg">
              <p>{profile.address.street}</p>
              <p>{profile.address.city}, {profile.address.postal_code}</p>
              <p>{profile.address.country}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">CNS Card</h3>
        {profile.cns_card_front && profile.cns_card_back ? (
          <CNSCardDisplay 
            frontImage={profile.cns_card_front}
            backImage={profile.cns_card_back}
            cardNumber={profile.cns_number}
          />
        ) : (
          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              No CNS card registered. Please scan both sides of your card.
            </p>
            <Button onClick={() => setShowScanner(true)}>
              Scan CNS Card
            </Button>
          </Card>
        )}
      </div>

      {showScanner && (
        <CNSCardScanner 
          onClose={() => setShowScanner(false)}
          onScanComplete={async (frontImage, backImage, cardNumber) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
              .from('profiles')
              .update({
                cns_card_front: frontImage,
                cns_card_back: backImage,
                cns_number: cardNumber
              })
              .eq('id', user.id);

            setShowScanner(false);
          }}
        />
      )}
    </div>
  );
};

export default PersonalDetails;
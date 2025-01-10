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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h2 className="text-2xl font-bold mb-8">Profile</h2>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* Personal Information Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="mt-1 text-lg">{profile.full_name || 'Not provided'}</p>
            </div>
            {profile.date_of_birth && (
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="mt-1 text-lg">{format(new Date(profile.date_of_birth), 'PP')}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-lg">{profile.email || 'Not provided'}</p>
            </div>
          </div>
        </Card>

        {/* Address Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Default Address</h3>
          {profile.address ? (
            <div className="space-y-2">
              <p className="text-lg">{profile.address.street}</p>
              <p className="text-lg">
                {profile.address.city}, {profile.address.postal_code}
              </p>
              <p className="text-lg">{profile.address.country}</p>
            </div>
          ) : (
            <p className="text-gray-500">No default address set</p>
          )}
        </Card>

        {/* CNS Card Section - Full Width */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">CNS Card</h3>
            {profile.cns_card_front && profile.cns_card_back ? (
              <div className="max-w-md mx-auto">
                <CNSCardDisplay 
                  frontImage={profile.cns_card_front}
                  backImage={profile.cns_card_back}
                  cardNumber={profile.cns_number}
                />
                <p className="text-sm text-gray-500 text-center mt-4">
                  Click on the card to flip it
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  No CNS card registered. Please scan both sides of your card.
                </p>
                <Button onClick={() => setShowScanner(true)}>
                  Scan CNS Card
                </Button>
              </div>
            )}
          </Card>
        </div>
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
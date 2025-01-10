import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CNSCardScanner from "./CNSCardScanner";
import CNSCardDisplay from "./CNSCardDisplay";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const PersonalDetails = () => {
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: profile } = useQuery({
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

  const updateDateOfBirthMutation = useMutation({
    mutationFn: async (date: Date) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ date_of_birth: format(date, 'yyyy-MM-dd') })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Date of Birth Updated",
        description: "Your date of birth has been updated successfully.",
      });
      setShowDatePicker(false);
    },
  });

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
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <div className="flex items-center gap-2">
                <p className="mt-1 text-lg">
                  {format(new Date(profile.date_of_birth), 'PPP')}
                </p>
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !profile.date_of_birth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Change date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(profile.date_of_birth)}
                      onSelect={(date) => {
                        if (date) {
                          updateDateOfBirthMutation.mutate(date);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
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
            <p className="text-red-500">Please add at least one address in the Addresses section</p>
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
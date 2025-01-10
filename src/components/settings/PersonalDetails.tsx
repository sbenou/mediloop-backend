import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    date_of_birth: null as Date | null,
  });

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
      
      // Initialize form data when profile is loaded
      if (!isEditing) {
        setFormData({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          date_of_birth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : null,
        });
      }
      
      return {
        ...profileData,
        address: addressData
      };
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (!data.date_of_birth) {
        throw new Error('Date of birth is required');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          date_of_birth: format(data.date_of_birth, 'yyyy-MM-dd'),
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date_of_birth) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Date of birth is required",
      });
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_of_birth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_of_birth ? format(formData.date_of_birth, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_of_birth || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, date_of_birth: date }))}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="mt-1 text-lg">{profile.full_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-lg">{profile.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="mt-1 text-lg">
                {profile.date_of_birth ? format(new Date(profile.date_of_birth), 'PPP') : 'Not provided'}
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        )}
      </Card>

      {/* Default Address Display */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Default Address</h3>
        {profile.address ? (
          <div className="space-y-2">
            <p className="text-lg">{profile.address.street}</p>
            <p className="text-lg">
              {profile.address.city}, {profile.address.postal_code}
            </p>
            <p className="text-lg">{profile.address.country}</p>
            <p className="text-sm text-gray-500 mt-2">
              To update your address, please use the Addresses tab.
            </p>
          </div>
        ) : (
          <p className="text-red-500">Please add at least one address in the Addresses tab</p>
        )}
      </Card>

      {/* CNS Card Section */}
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
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          }}
        />
      )}
    </div>
  );
};

export default PersonalDetails;
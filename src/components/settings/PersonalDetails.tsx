import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile/ProfileForm";
import { ProfileDisplay } from "./profile/ProfileDisplay";
import { DefaultAddress } from "./profile/DefaultAddress";
import { toast } from "@/components/ui/use-toast";

const PersonalDetails = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    date_of_birth: null as Date | null,
  });

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

      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (addressError) throw addressError;
      
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

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load profile data",
    });
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="h-40 animate-pulse bg-gray-200 rounded"></div>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        {isEditing ? (
          <ProfileForm
            initialData={formData}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ProfileDisplay
            profile={profile}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Default Address</h3>
        <DefaultAddress address={profile.address} />
      </Card>
    </div>
  );
};

export default PersonalDetails;
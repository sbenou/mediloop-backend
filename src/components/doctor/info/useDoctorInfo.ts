
import { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface DoctorFormData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
}

export const useDoctorInfo = (doctorId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = async (formData: DoctorFormData) => {
    setIsSubmitting(true);

    try {
      console.log('Saving doctor info for ID:', doctorId);

      // First, update the profile with basic info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          phone_number: formData.phone,
        })
        .eq('id', doctorId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }
      
      console.log('Profile updated successfully, now updating doctor_metadata');

      // Then, update or create doctor_metadata with address info
      const { data: metadataResult, error: metadataError } = await supabase
        .from('doctor_metadata')
        .upsert({
          doctor_id: doctorId,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
        }, {
          onConflict: 'doctor_id'
        });

      if (metadataError) {
        console.error('Error updating doctor_metadata:', metadataError);
        throw metadataError;
      }

      console.log('Doctor metadata updated successfully:', metadataResult);

      toast({
        title: "Success",
        description: "Doctor information updated successfully"
      });
      
      // Force a page refresh to show the updated information
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error updating doctor info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update doctor information"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSave
  };
};


import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { updateDoctorWorkspaceApi } from "@/services/professionalWorkspaceApi";

interface DoctorFormData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
}

export const useDoctorInfo = (
  doctorId: string,
  onSaved?: () => void,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (formData: DoctorFormData) => {
    if (!doctorId) return false;
    setIsSubmitting(true);

    try {
      await updateDoctorWorkspaceApi({
        full_name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postalCode || null,
      });

      toast({
        title: "Success",
        description: "Doctor information updated successfully",
      });

      onSaved?.();
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

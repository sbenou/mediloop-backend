
import { useState, useRef } from "react";
import { UserProfile } from "@/types/user";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth/useAuth";

export const useSidebarUserProfile = (profile: UserProfile | null) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  const getUserInitials = () => {
    // For pharmacists, use pharmacy name if available
    if (userRole === 'pharmacist' && profile?.pharmacy_name) {
      const pharmacyNames = profile.pharmacy_name.split(' ');
      if (pharmacyNames.length === 1) return pharmacyNames[0].charAt(0).toUpperCase();
      return (pharmacyNames[0].charAt(0) + pharmacyNames[pharmacyNames.length - 1].charAt(0)).toUpperCase();
    }
    
    // Default to user initials
    if (!profile?.full_name) return '';
    const names = profile.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      toast({
        title: "Uploading image",
        description: "Your profile image is being updated...",
      });
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Check if storage bucket exists, create if not
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw bucketsError;
      }
      
      // Use consistent bucket names and paths
      const bucketName = 'pharmacy-images';
      let filePath;
      
      if (userRole === 'pharmacist') {
        // Consistent path for pharmacy images
        // Get pharmacy_id if available
        const { data: pharmacyData } = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', userId)
          .single();
        
        const pharmacyId = pharmacyData?.pharmacy_id;
        filePath = pharmacyId 
          ? `pharmacies/${pharmacyId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
          : `users/${userId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      } else {
        // For doctors or regular users
        filePath = `users/${userId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      }
      
      console.log('Attempting to upload to bucket:', bucketName, 'path:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Successfully uploaded, publicUrl:', publicUrl);

      // Use consistent field names for different user types
      const fieldToUpdate = userRole === 'pharmacist' ? 'pharmacy_logo_url' : 
                            userRole === 'doctor' ? 'doctor_stamp_url' : 
                            'avatar_url';
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [fieldToUpdate]: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw updateError;
      }

      // Invalidate the profile query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({
        title: "Success",
        description: `${userRole === 'pharmacist' ? 'Pharmacy logo' : userRole === 'doctor' ? 'Doctor cabinet' : 'Profile image'} updated successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${userRole === 'pharmacist' ? 'pharmacy logo' : userRole === 'doctor' ? 'doctor cabinet' : 'profile image'}`,
      });
    }
  };

  return {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  };
};

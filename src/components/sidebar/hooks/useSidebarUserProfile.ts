
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

      // Determine the correct bucket based on context
      let bucketName = 'avatars'; // Default bucket for regular avatars
      const filePath = `${userId}/${crypto.randomUUID()}`;
      
      // For pharmacists uploading logo, use the pharmacy-logos bucket
      if (userRole === 'pharmacist') {
        bucketName = 'pharmacy-logos';
      }
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Determine which field to update based on role and context
      let fieldToUpdate = 'avatar_url'; // Default for profile avatars
      
      // For pharmacists updating from sidebar, update the pharmacy logo
      if (userRole === 'pharmacist') {
        fieldToUpdate = 'pharmacy_logo_url';
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [fieldToUpdate]: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Invalidate the profile query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({
        title: "Success",
        description: `${userRole === 'pharmacist' ? 'Pharmacy logo' : 'Profile picture'} updated successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${userRole === 'pharmacist' ? 'pharmacy logo' : 'profile picture'}`,
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

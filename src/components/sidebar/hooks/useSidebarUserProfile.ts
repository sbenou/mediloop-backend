
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

      const filePath = `${userId}/${crypto.randomUUID()}`;
      const bucketName = userRole === 'pharmacist' ? 'pharmacy-logos' : 'avatars';
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const fieldToUpdate = userRole === 'pharmacist' ? 'pharmacy_logo_url' : 'avatar_url';
      
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

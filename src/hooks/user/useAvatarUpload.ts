
import { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useRecoilState } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { UserProfile } from "@/types/user";

export const useAvatarUpload = (profile: UserProfile | null) => {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useRecoilState(userAvatarState);

  // Set initial avatar URL from profile
  if (profile?.avatar_url && !avatarUrl) {
    setAvatarUrl(profile.avatar_url);
  }

  const handleFileChange = async (file: File | null) => {
    if (file && profile?.id) {
      try {
        setIsUploading(true);
        
        toast({
          title: "Uploading photo",
          description: "Your profile picture is being updated...",
        });

        const userId = profile.id;
        if (!userId) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "User not found",
          });
          return;
        }

        // Check if avatars bucket exists, create if not
        const { error: bucketError } = await supabase.storage.getBucket('avatars');
        if (bucketError && bucketError.message.includes('not found')) {
          const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
          });
          
          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            throw new Error('Failed to create storage bucket');
          }
        }
        
        const filePath = `${userId}/${crypto.randomUUID()}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }

        // Update Recoil state
        setAvatarUrl(publicUrl);

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update profile picture",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return {
    avatarUrl,
    isUploading,
    handleFileChange
  };
};

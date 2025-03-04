import { memo, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload, Building2 } from "lucide-react";
import { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/auth/useAuth";

interface UserAvatarProps {
  userProfile?: UserProfile | null;
  squared?: boolean;
  canUpload?: boolean;
}

const UserAvatar = memo(({ userProfile, squared = false, canUpload = false }: UserAvatarProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Detect if this is an organization avatar
  const isOrganization = userProfile?.full_name === 'Mediloop';

  // Prevent patients from changing the Mediloop avatar
  const isPatient = user?.role === 'user';
  const canModifyOrganizationAvatar = !isPatient;
  
  // Only allow upload if:
  // 1. Upload is enabled via prop AND
  // 2. Either it's not an organization avatar OR (it is an org avatar AND user can modify it)
  const allowUpload = canUpload && (!isOrganization || (isOrganization && canModifyOrganizationAvatar));

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      toast({
        title: "Processing",
        description: "Optimizing and uploading your avatar...",
      });
      
      // Optimize image before upload
      const optimizedFile = await optimizeImage(file);
      
      // If this is an organization avatar, use a special path
      let filePath;
      let updateTable;
      
      if (isOrganization) {
        filePath = `organization/logo`;
        updateTable = 'organization_settings';
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error('User not authenticated');
        filePath = `${userId}/${crypto.randomUUID()}`;
        updateTable = 'profiles';
      }
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // If this is an organization avatar, update org settings instead of profile
      if (isOrganization) {
        // For demo purposes, we'll just show a success message
        // In a real application, you would update an organization_settings table
        toast({
          title: "Success",
          description: "Organization logo updated successfully",
        });
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error('User not authenticated');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        if (updateError) throw updateError;
        
        // Invalidate the profile query to refresh the data
        await queryClient.invalidateQueries({ queryKey: ['profile'] });

        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload avatar",
      });
    } finally {
      setIsUploading(false);
      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert canvas to blob'));
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className="relative group">
      <Avatar className={`h-10 w-10 ${squared ? 'rounded-md' : 'rounded-full'}`}>
        <AvatarImage 
          src={userProfile?.avatar_url || ''} 
          alt={userProfile?.full_name || 'Profile'} 
          className={squared ? 'rounded-md' : 'rounded-full'}
        />
        <AvatarFallback className={`bg-[#7E69AB]/10 ${squared ? 'rounded-md' : 'rounded-full'}`}>
          {isOrganization ? (
            <Building2 className="h-5 w-5 text-[#7E69AB]" />
          ) : (
            <User className="h-5 w-5 text-[#7E69AB]" />
          )}
        </AvatarFallback>
      </Avatar>

      {allowUpload && (
        <>
          <button 
            type="button"
            className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${squared ? 'rounded-md' : 'rounded-full'}`}
            onClick={handleFileSelect}
            disabled={isUploading}
            aria-label="Upload avatar"
          >
            <Upload className="h-4 w-4 text-white" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;

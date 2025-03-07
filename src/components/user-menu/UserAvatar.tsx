
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface UserAvatarProps {
  userProfile: UserProfile | null;
  size?: "sm" | "md" | "lg";
  canUpload?: boolean;
  squared?: boolean; // Add the squared property
}

const UserAvatar = ({ userProfile, size = "md", canUpload = false, squared = false }: UserAvatarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const getSize = () => {
    switch (size) {
      case "sm": return "h-8 w-8";
      case "lg": return "h-12 w-12";
      case "md":
      default: return "h-10 w-10";
    }
  };
  
  const getInitials = () => {
    if (!userProfile?.full_name) return "U";
    return userProfile.full_name
      .split(" ")
      .map(name => name.charAt(0))
      .join("")
      .toUpperCase();
  };
  
  const handleAvatarClick = () => {
    if (canUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.id) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${userProfile.id}-${Date.now()}`, file, {
          upsert: true,
        });
        
      if (error) {
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
        
      // Update profile with new avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userProfile.id);
        
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
      
      // Force a page refresh to update the avatar
      window.location.reload();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your profile picture.",
      });
    }
  };

  return (
    <>
      <Avatar 
        className={`${getSize()} ${canUpload ? 'cursor-pointer hover:opacity-80' : ''} ${squared ? 'rounded-md' : 'rounded-full'}`}
        onClick={canUpload ? handleAvatarClick : undefined}
      >
        <AvatarImage 
          src={userProfile?.avatar_url || undefined} 
          alt={userProfile?.full_name || "User"} 
        />
        <AvatarFallback className={squared ? 'rounded-md' : 'rounded-full'}>{getInitials()}</AvatarFallback>
      </Avatar>
      
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      )}
    </>
  );
};

export default UserAvatar;

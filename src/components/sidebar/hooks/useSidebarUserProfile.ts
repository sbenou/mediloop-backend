
import { useState, useRef } from "react";
import { UserProfile } from "@/types/user";
import { toast } from "@/components/ui/use-toast";

export const useSidebarUserProfile = (profile: UserProfile | null) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    console.log("Avatar file selected:", file.name);
    toast({
      title: "Avatar update",
      description: "Profile image update started",
    });
    
    // Here you would typically upload the file to your storage
    // This is a placeholder for the actual implementation
  };

  return {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  };
};

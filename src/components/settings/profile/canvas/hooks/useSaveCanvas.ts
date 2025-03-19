
import { useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useSaveCanvas = (type: 'stamp' | 'signature', userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const saveCanvas = async (canvas: FabricCanvas | null) => {
    if (!canvas || !userId) return;
    
    setIsLoading(true);
    try {
      console.log(`Starting ${type} save process...`);
      
      // Convert canvas to data URL with the required multiplier option
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      console.log(`${type} canvas converted to data URL`);
      
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      console.log(`${type} blob created: ${blob.size} bytes, type: ${blob.type}`);
      
      // Upload to Supabase storage
      const filePath = `${type === 'stamp' ? 'stamps' : 'signatures'}/${userId}/${Date.now()}.png`;
      console.log(`Preparing to upload ${type} to: ${filePath}`);
      
      // Upload the file - no need to check or create the bucket since we already did that with SQL
      const { error: uploadError } = await supabase.storage
        .from('doctor-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Error uploading ${type}:`, uploadError);
        throw uploadError;
      }
      
      console.log(`${type} uploaded successfully, getting public URL`);
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('doctor-images')
        .getPublicUrl(filePath);
      
      console.log(`Public URL obtained: ${urlData.publicUrl}`);
      
      // Add cache-busting query parameter to force reload
      const cachebustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      // Update profile
      const fieldName = type === 'stamp' ? 'doctor_stamp_url' : 'doctor_signature_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [fieldName]: cachebustedUrl })
        .eq('id', userId);
      
      if (updateError) {
        console.error(`Error updating profile with ${type} URL:`, updateError);
        throw updateError;
      }
      
      console.log(`Profile updated with new ${type} URL`);
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: "Success",
        description: `Doctor ${type} uploaded successfully`
      });
    } catch (error: any) {
      console.error(`Error saving ${type}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to upload ${type}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveCanvas,
    isLoading
  };
};

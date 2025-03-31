
import { useState } from 'react';
import { Canvas } from 'fabric';
import { useToast } from '@/components/ui/use-toast';
import { useRecoilState } from 'recoil';
import { 
  doctorStampUrlState,
  doctorSignatureUrlState,
  pharmacistStampUrlState,
  pharmacistSignatureUrlState
} from '@/store/images/atoms';
import { supabase } from '@/lib/supabase';

export const useSaveCanvas = (type: 'stamp' | 'signature', userId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Get appropriate Recoil state based on type
  const [doctorStampUrl, setDoctorStampUrl] = useRecoilState(doctorStampUrlState);
  const [doctorSignatureUrl, setDoctorSignatureUrl] = useRecoilState(doctorSignatureUrlState);
  const [pharmacistStampUrl, setPharmacistStampUrl] = useRecoilState(pharmacistStampUrlState);
  const [pharmacistSignatureUrl, setPharmacistSignatureUrl] = useRecoilState(pharmacistSignatureUrlState);

  const getUrlAtom = (type: 'stamp' | 'signature', role: 'doctor' | 'pharmacist') => {
    if (role === 'doctor' && type === 'stamp') return [doctorStampUrl, setDoctorStampUrl] as const;
    if (role === 'doctor' && type === 'signature') return [doctorSignatureUrl, setDoctorSignatureUrl] as const;
    if (role === 'pharmacist' && type === 'stamp') return [pharmacistStampUrl, setPharmacistStampUrl] as const;
    return [pharmacistSignatureUrl, setPharmacistSignatureUrl] as const;
  };

  const saveCanvas = async (canvas: Canvas) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is missing. Cannot save the canvas.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Saving ${type} for user ${userId}`);
      
      // First determine if this is for a doctor or pharmacist by checking the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError || !profileData) {
        throw new Error(`Could not determine user role: ${profileError?.message || 'Unknown error'}`);
      }
      
      const userRole = profileData.role === 'doctor' ? 'doctor' : 'pharmacist';
      console.log(`User role determined: ${userRole}`);
      
      // Get canvas as dataURL (PNG)
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 2 // Better resolution
      });
      
      // Create a blob from the dataURL
      const blobData = await fetch(dataUrl).then(res => res.blob());
      
      // Generate a unique filename
      const filename = `${userRole}_${type}_${userId}_${Date.now()}.png`;
      
      // Use our new private bucket for professional images
      const bucketName = 'professional-images';
      // Store in a folder structure that matches the user's ID
      const filePath = `${userId}/${filename}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, blobData, {
          contentType: 'image/png',
          upsert: true
        });
        
      if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }
      
      // Get the URL (note: since the bucket is private, this will be a signed URL)
      const { data: urlData } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
        
      if (!urlData || !urlData.signedUrl) {
        throw new Error("Failed to get a signed URL for the image");
      }
      
      const signedUrl = urlData.signedUrl;
      console.log(`File uploaded successfully, signed URL created`);
      
      // Update the profile in the database
      const updateField = userRole === 'doctor' 
        ? (type === 'stamp' ? 'doctor_stamp_url' : 'doctor_signature_url')
        : (type === 'stamp' ? 'pharmacist_stamp_url' : 'pharmacist_signature_url');
        
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: signedUrl })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      // Update the Recoil state
      const [_, setUrlState] = getUrlAtom(type, userRole as 'doctor' | 'pharmacist');
      setUrlState(signedUrl);
      
      toast({
        title: "Success",
        description: `Your ${type} has been saved successfully.`
      });
      
      console.log(`${userRole} ${type} saved successfully`);
      return signedUrl;
    } catch (error) {
      console.error('Error saving canvas:', error);
      toast({
        title: "Error",
        description: `Failed to save your ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a canvas image
  const deleteCanvasImage = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is missing. Cannot delete the canvas image.",
        variant: "destructive"
      });
      return;
    }

    // Use separate loading state for delete operation
    setIsDeleting(true);

    try {
      console.log(`Deleting ${type} for user ${userId}`);
      
      // Determine if this is for a doctor or pharmacist by checking the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (profileError || !profileData) {
        throw new Error(`Could not determine user role: ${profileError?.message || 'Unknown error'}`);
      }
      
      const userRole = profileData.role === 'doctor' ? 'doctor' : 'pharmacist';
      console.log(`User role determined: ${userRole}`);
      
      // Determine which field to update based on type and role
      const updateField = userRole === 'doctor' 
        ? (type === 'stamp' ? 'doctor_stamp_url' : 'doctor_signature_url')
        : (type === 'stamp' ? 'pharmacist_stamp_url' : 'pharmacist_signature_url');
      
      // Update the profile in the database to set the URL to null
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: null })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
      
      // Update the Recoil state to null immediately
      const [_, setUrlState] = getUrlAtom(type, userRole as 'doctor' | 'pharmacist');
      setUrlState(null);
      
      return true;
    } catch (error) {
      console.error('Error deleting canvas image:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return { saveCanvas, deleteCanvasImage, isLoading, isDeleting };
};

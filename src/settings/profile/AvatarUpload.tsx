import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import Webcam from 'react-webcam';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRecoilState } from 'recoil';
import { userAvatarState } from '@/store/user/atoms';
import { doctorStampUrlState, doctorSignatureUrlState, pharmacyLogoUrlState } from '@/store/images/atoms';
import { useLocation } from 'react-router-dom';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarUpdate: (url: string) => void;
  label?: string;
}

const AvatarUpload = ({ currentAvatarUrl, onAvatarUpdate, label = "Profile Photo" }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { userRole, user } = useAuth();
  const location = useLocation();
  
  // Use Recoil state for image URLs
  const [avatarUrl, setAvatarUrl] = useRecoilState(userAvatarState);
  const [doctorStampUrl, setDoctorStampUrl] = useRecoilState(doctorStampUrlState);
  const [doctorSignatureUrl, setDoctorSignatureUrl] = useRecoilState(doctorSignatureUrlState);
  const [pharmacyLogoUrl, setPharmacyLogoUrl] = useRecoilState(pharmacyLogoUrlState);
  
  // Add a state to track the local avatar URL for immediate display
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(currentAvatarUrl);

  // Set initial Recoil state from props
  useEffect(() => {
    if (currentAvatarUrl) {
      // Determine which Recoil state to update based on the label and user role
      if (label.toLowerCase().includes('stamp')) {
        setDoctorStampUrl(currentAvatarUrl);
      } else if (label.toLowerCase().includes('signature')) {
        setDoctorSignatureUrl(currentAvatarUrl);
      } else if (userRole === 'pharmacist' && label.toLowerCase().includes('logo')) {
        setPharmacyLogoUrl(currentAvatarUrl);
      } else if (userRole === 'pharmacist' && label === "Profile Photo") {
        // For pharmacists, "Profile Photo" refers to the pharmacy logo in profile context
        setPharmacyLogoUrl(currentAvatarUrl);
      } else if (userRole === 'doctor' && label === "Profile Photo" && 
                 location.pathname.includes('doctor') || location.search.includes('doctor')) {
        // For doctors in doctor profile context, update doctor stamp
        setDoctorStampUrl(currentAvatarUrl);
      } else {
        // For patients or general user avatar (not in professional context)
        setAvatarUrl(currentAvatarUrl);
      }
    }
  }, [currentAvatarUrl, label, userRole, location.pathname, location.search]);

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);
      console.log('Starting avatar upload process...');
      
      const optimizedFile = await optimizeImage(file);
      console.log('Image optimized, file size:', optimizedFile.size);
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        console.error('No user ID found');
        throw new Error('User not authenticated');
      }
      
      console.log('Uploading avatar for user:', userId);

      // Determine correct bucket and path based on role and asset type
      let bucketName = 'avatars';
      let filePath = `${userId}/${Date.now()}`;
      let fieldToUpdate = 'avatar_url';
      
      // Check if we're in a professional profile context
      const isProfessionalProfile = location.pathname.includes('doctor') || 
                                   location.pathname.includes('pharmacy') ||
                                   location.search.includes('doctor') ||
                                   location.search.includes('pharmacy');
      
      if (userRole === 'pharmacist') {
        if (label.toLowerCase().includes('logo') || 
            (label === "Profile Photo" && isProfessionalProfile)) {
          bucketName = 'pharmacy-logos';
          fieldToUpdate = 'pharmacy_logo_url';
        }
      } else if (userRole === 'doctor') {
        if (label.toLowerCase().includes('stamp') || 
            (label === "Profile Photo" && isProfessionalProfile)) {
          bucketName = 'doctor-images';
          filePath = `stamps/${userId}/${Date.now()}`;
          fieldToUpdate = 'doctor_stamp_url';
        } else if (label.toLowerCase().includes('signature')) {
          bucketName = 'doctor-images';
          filePath = `signatures/${userId}/${Date.now()}`;
          fieldToUpdate = 'doctor_signature_url';
        }
      }
      
      console.log(`Uploading to ${bucketName} bucket:`, filePath);
      console.log('File type:', optimizedFile.type);
      console.log('File size:', optimizedFile.size);
      console.log('Field to update:', fieldToUpdate);
      
      // Make sure the file is treated as an image
      const contentType = 'image/jpeg';
      
      try {
        console.log('Uploading file to storage...');
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from(bucketName)
          .upload(filePath, optimizedFile, {
            upsert: true,
            contentType: contentType
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        console.log('Upload successful, getting public URL');

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        console.log('Public URL:', urlData.publicUrl);
        
        // Add cache-busting query parameter to force reload
        const publicUrlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;
        
        console.log(`Updating profile with ${fieldToUpdate}:`, publicUrlWithCacheBust);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ [fieldToUpdate]: publicUrlWithCacheBust })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        // Set the local avatar URL for immediate display
        setLocalAvatarUrl(publicUrlWithCacheBust);
        
        // Update the appropriate Recoil state
        if (userRole === 'pharmacist' && 
            (label.toLowerCase().includes('logo') || 
            (label === "Profile Photo" && isProfessionalProfile))) {
          setPharmacyLogoUrl(publicUrlWithCacheBust);
        } else if (userRole === 'doctor') {
          if (label.toLowerCase().includes('stamp') || 
              (label === "Profile Photo" && isProfessionalProfile)) {
            setDoctorStampUrl(publicUrlWithCacheBust);
          } else if (label.toLowerCase().includes('signature')) {
            setDoctorSignatureUrl(publicUrlWithCacheBust);
          } else if (!isProfessionalProfile) {
            setAvatarUrl(publicUrlWithCacheBust);
          }
        } else {
          setAvatarUrl(publicUrlWithCacheBust);
        }
        
        // Update the UI through the parent component
        onAvatarUpdate(publicUrlWithCacheBust);
        
        // Invalidate the profile queries to refresh the data
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        if (userId) {
          await queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
        }

        toast({
          title: "Success",
          description: `${label} updated successfully`,
        });
      } catch (uploadErr: any) {
        console.error('File upload error:', uploadErr);
        throw new Error(`Error uploading file: ${uploadErr.message}`);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to upload ${label}: ${error.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const optimizeImage = async (file: File): Promise<Blob> => {
    console.log('Optimizing image:', file.name, file.type, file.size);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        console.log('Original dimensions:', width, 'x', height);
        
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
        
        console.log('Resized dimensions:', width, 'x', height);

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Optimized blob size:', blob.size);
              resolve(blob);
            } else {
              console.error('Failed to convert canvas to blob');
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = (e) => {
        console.error('Error loading image:', e);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      // Show a temporary preview before uploading
      const localObjectUrl = URL.createObjectURL(file);
      setLocalAvatarUrl(localObjectUrl);
      await uploadAvatar(file);
    }
  };

  const handleCameraCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        console.log('Captured webcam image');
        // Show a temporary preview before uploading
        setLocalAvatarUrl(imageSrc);
        
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        console.log('Webcam image blob size:', blob.size);
        const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });
        await uploadAvatar(file);
        setShowCamera(false);
      }
    }
  };

  // Use the local avatar URL for display, falling back to the prop
  const displayAvatarUrl = localAvatarUrl || currentAvatarUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayAvatarUrl || undefined} alt="Profile" crossOrigin="anonymous" />
          <AvatarFallback className="bg-primary/10">
            <User className="h-12 w-12 text-primary" />
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload {userRole === 'pharmacist' ? 'Logo' : 'Photo'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCamera(!showCamera)}
              disabled={isUploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              {showCamera ? 'Hide Camera' : 'Take Photo'}
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <p className="text-sm text-muted-foreground">
            Recommended: Square JPG, PNG. Max 5MB
          </p>
        </div>
      </div>

      {showCamera && (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="rounded-lg"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button onClick={handleCameraCapture} disabled={isUploading}>
              Capture Photo
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCamera(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;


import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import Webcam from 'react-webcam';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';

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
  const { userRole } = useAuth();
  
  // Add a state to track the local avatar URL for immediate display
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(currentAvatarUrl);

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

      const filePath = `${userId}/${crypto.randomUUID()}`;
      const bucketName = userRole === 'pharmacist' ? 'pharmacy-logos' : 'avatars';
      
      console.log(`Uploading to ${bucketName} bucket:`, filePath);
      console.log('File type:', optimizedFile.type);
      console.log('File size:', optimizedFile.size);
      
      // Create the bucket if it doesn't exist
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
      console.log('Bucket check result:', bucketData, bucketError);
      
      if (bucketError) {
        console.log('Creating bucket:', bucketName);
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createBucketError) {
          // If bucket already exists, ignore the error
          if (!createBucketError.message.includes('already exists')) {
            console.error('Error creating bucket:', createBucketError);
            throw createBucketError;
          }
        }
      }
      
      // Add policy directly via updateBucket if it doesn't exist
      try {
        console.log('Updating bucket settings for', bucketName);
        const { error } = await supabase.storage.updateBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB limit
        });
        
        if (error) {
          console.log('Could not update bucket settings:', error);
        }
      } catch (error) {
        console.log('Error updating bucket settings:', error);
      }
      
      console.log('Uploading file to storage...');
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(bucketName)
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: 'image/jpeg'
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
      
      const fieldToUpdate = userRole === 'pharmacist' ? 'pharmacy_logo_url' : 'avatar_url';
      
      console.log(`Updating profile with ${fieldToUpdate}:`, urlData.publicUrl);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [fieldToUpdate]: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      // Set the local avatar URL for immediate display
      setLocalAvatarUrl(urlData.publicUrl);
      
      // Update the UI through the parent component
      onAvatarUpdate(urlData.publicUrl);
      
      // Invalidate the profile query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({
        title: "Success",
        description: `${userRole === 'pharmacist' ? 'Pharmacy logo' : 'Avatar'} updated successfully`,
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to upload ${userRole === 'pharmacist' ? 'pharmacy logo' : 'avatar'}: ${error.message}`,
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
      setLocalAvatarUrl(URL.createObjectURL(file));
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
          <AvatarImage src={displayAvatarUrl || undefined} alt="Profile" />
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

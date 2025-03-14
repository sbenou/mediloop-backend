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
      
      const optimizedFile = await optimizeImage(file);
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const filePath = `${userId}/${crypto.randomUUID()}`;
      const bucketName = userRole === 'pharmacist' ? 'pharmacy-logos' : 'avatars';
      
      // Create the bucket if it doesn't exist
      const { data: bucketExists } = await supabase.storage.getBucket(bucketName);
      if (!bucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        if (bucketError) {
          // If bucket already exists, ignore the error
          if (!bucketError.message.includes('already exists')) {
            console.error('Error creating bucket:', bucketError);
            throw bucketError;
          }
        }
      }
      
      // Add policy directly via updateBucket if it doesn't exist
      try {
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
      
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: 'image/jpeg'
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

      // Set the local avatar URL for immediate display
      setLocalAvatarUrl(publicUrl);
      
      // Update the UI through the parent component
      onAvatarUpdate(publicUrl);
      
      // Invalidate the profile query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({
        title: "Success",
        description: `${userRole === 'pharmacist' ? 'Pharmacy logo' : 'Avatar'} updated successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to upload ${userRole === 'pharmacist' ? 'pharmacy logo' : 'avatar'}`,
      });
    } finally {
      setIsUploading(false);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show a temporary preview before uploading
      setLocalAvatarUrl(URL.createObjectURL(file));
      await uploadAvatar(file);
    }
  };

  const handleCameraCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Show a temporary preview before uploading
        setLocalAvatarUrl(imageSrc);
        
        const response = await fetch(imageSrc);
        const blob = await response.blob();
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

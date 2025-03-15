
import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCanvasManager } from './useCanvasManager';
import CanvasControls from './CanvasControls';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CanvasSectionProps {
  title: string;
  description: string;
  imageUrl: string | null;
  type: 'stamp' | 'signature';
  userId: string;
}

const CanvasSection: React.FC<CanvasSectionProps> = ({
  title,
  description,
  imageUrl,
  type,
  userId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const {
    canvasContainerRef,
    canvas,
    isDrawMode,
    penColor,
    toggleDrawMode,
    clearCanvas,
    handleColorChange
  } = useCanvasManager({ imageUrl });

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvas) {
      // Ensure white background before processing
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && canvas) {
          const imgUrl = event.target.result.toString();
          
          // Use the loadImageToCanvas function from canvasUtils
          import('./canvasUtils').then(({ loadImageToCanvas }) => {
            loadImageToCanvas(canvas, imgUrl);
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCanvas = async () => {
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
      
      // Ensure the bucket exists
      try {
        const { error: bucketError } = await supabase.storage.getBucket('doctor-images');
        if (bucketError) {
          console.log('Error getting bucket:', bucketError);
          if (bucketError.message.includes('not found')) {
            console.log('Bucket not found, creating it...');
            const { error: createBucketError } = await supabase.storage.createBucket('doctor-images', {
              public: true,
              fileSizeLimit: 5242880, // 5MB
              allowedMimeTypes: ['image/png', 'image/jpeg']
            });
            
            if (createBucketError) {
              console.error('Error creating bucket:', createBucketError);
              throw createBucketError;
            }
            console.log('Bucket created successfully');
          } else {
            throw bucketError;
          }
        }
      } catch (error) {
        console.error('Bucket error check failed:', error);
        // Continue with upload attempt even if bucket check fails
      }
      
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
      
      // Update profile
      const fieldName = type === 'stamp' ? 'doctor_stamp_url' : 'doctor_signature_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [fieldName]: urlData.publicUrl })
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <div 
            ref={canvasContainerRef}
            className="border rounded-md overflow-hidden bg-white w-full" 
            style={{ height: '200px' }}
          ></div>
          
          <CanvasControls 
            isDrawMode={isDrawMode}
            toggleDrawMode={toggleDrawMode}
            clearCanvas={clearCanvas}
            triggerUpload={triggerUpload}
            saveCanvas={saveCanvas}
            isLoading={isLoading}
            penColor={penColor}
            handleColorChange={handleColorChange}
            type={type}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CanvasSection;


import React, { useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSetRecoilState } from "recoil";
import { pharmacyLogoUrlState } from "@/store/images/atoms";

interface PharmacyImageUploadProps {
  pharmacyId: string;
  logoUrl: string | null | undefined;
  onImageUpdate: (newLogoUrl: string) => void;
  userId?: string;
}

const PharmacyImageUpload: React.FC<PharmacyImageUploadProps> = ({ 
  pharmacyId,
  logoUrl,
  onImageUpdate,
  userId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPharmacyLogoUrl = useSetRecoilState(pharmacyLogoUrlState);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pharmacyId) return;

    try {
      setIsUploading(true);
      toast({
        title: "Uploading image",
        description: "Please wait while we upload your pharmacy image...",
      });
      
      const bucketName = 'pharmacy-images';
      
      // Create a consistent path for pharmacy images - always use pharmacies folder
      const filePath = `pharmacies/${pharmacyId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      console.log('Attempting to upload to:', bucketName, filePath);
      
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Successfully uploaded, publicUrl:', publicUrl);
      
      // Add cache-busting parameter
      const publicUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Create or update pharmacy metadata with the logo URL
      const { error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .upsert({ 
          pharmacy_id: pharmacyId,
          logo_url: publicUrlWithCacheBust
        });

      if (metadataError) {
        console.error('Metadata error:', metadataError);
        throw metadataError;
      }

      // Update the Recoil state for global access
      console.log("Setting pharmacy logo after upload:", publicUrlWithCacheBust);
      setPharmacyLogoUrl(publicUrlWithCacheBust);
      
      // Also update the pharmacy_logo_url in the profiles table for the current user
      if (userId) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ pharmacy_logo_url: publicUrlWithCacheBust })
          .eq('id', userId);
          
        if (profileUpdateError) {
          console.error('Error updating profile with logo URL:', profileUpdateError);
          // Not throwing here as the main upload was successful
        }
      }

      // Update parent component
      onImageUpdate(publicUrlWithCacheBust);

      toast({
        title: "Success",
        description: "Pharmacy image updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading pharmacy image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error uploading pharmacy image: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      onClick={handleImageClick}
      className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden border border-dashed border-gray-300 hover:bg-gray-50 transition-colors"
    >
      {logoUrl ? (
        <div className="w-full h-full relative">
          <img 
            src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
            alt="Pharmacy Logo" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button variant="outline" className="bg-white/80">
              <Upload className="mr-2 h-4 w-4" />
              Change Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload pharmacy image</h3>
          <p className="mt-1 text-sm text-gray-500">Click to upload a logo or image for your pharmacy</p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
};

export default PharmacyImageUpload;

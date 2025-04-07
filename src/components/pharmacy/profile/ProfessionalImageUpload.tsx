
import React, { useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSetRecoilState } from "recoil";
import { pharmacyLogoUrlState, doctorLogoUrlState } from "@/store/images/atoms";

interface ProfessionalImageUploadProps {
  entityId: string;
  entityType: 'doctor' | 'pharmacy';
  logoUrl: string | null | undefined;
  onImageUpdate: (newLogoUrl: string) => void;
  userId?: string;
}

const ProfessionalImageUpload: React.FC<ProfessionalImageUploadProps> = ({ 
  entityId,
  entityType,
  logoUrl,
  onImageUpdate,
  userId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPharmacyLogoUrl = useSetRecoilState(pharmacyLogoUrlState);
  const setDoctorLogoUrl = useSetRecoilState(doctorLogoUrlState);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;

    try {
      setIsUploading(true);
      toast({
        title: "Uploading image",
        description: `Please wait while we upload your ${entityType} image...`,
      });
      
      // Determine the correct bucket and path based on entity type
      const bucketName = entityType === 'doctor' ? 'doctor-images' : 'pharmacy-images';
      const folderPath = entityType === 'doctor' ? 'doctors' : 'pharmacies';
      
      // Create a consistent path for entity images
      const filePath = `${folderPath}/${entityId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      console.log(`Attempting to upload to: ${bucketName}`, filePath);
      
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

      // Create or update the appropriate metadata with the logo URL
      if (entityType === 'pharmacy') {
        // Update pharmacy metadata
        const { error: metadataError } = await supabase
          .from('pharmacy_metadata')
          .upsert({ 
            pharmacy_id: entityId,
            logo_url: publicUrlWithCacheBust
          });

        if (metadataError) {
          console.error('Metadata error:', metadataError);
          throw metadataError;
        }

        // Update the Recoil state for global access
        console.log("Setting pharmacy logo after upload:", publicUrlWithCacheBust);
        setPharmacyLogoUrl(publicUrlWithCacheBust);
        
      } else {
        // Update doctor metadata
        const { error: metadataError } = await supabase
          .from('doctor_metadata')
          .upsert({ 
            doctor_id: entityId,
            logo_url: publicUrlWithCacheBust
          });

        if (metadataError) {
          console.error('Metadata error:', metadataError);
          throw metadataError;
        }

        // Update the Recoil state for global access
        console.log("Setting doctor logo after upload:", publicUrlWithCacheBust);
        setDoctorLogoUrl(publicUrlWithCacheBust);
      }
      
      // Also update the profile with appropriate field based on entity type
      if (userId) {
        const fieldToUpdate = entityType === 'doctor' ? 'doctor_stamp_url' : 'pharmacy_logo_url';
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ [fieldToUpdate]: publicUrlWithCacheBust })
          .eq('id', userId);
          
        if (profileUpdateError) {
          console.error(`Error updating profile with ${fieldToUpdate}:`, profileUpdateError);
          // Not throwing here as the main upload was successful
        }
      }

      // Update parent component
      onImageUpdate(publicUrlWithCacheBust);

      toast({
        title: "Success",
        description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} image updated successfully`,
      });
    } catch (error: any) {
      console.error(`Error uploading ${entityType} image:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error uploading ${entityType} image: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <div 
      onClick={handleImageClick}
      className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden border border-dashed border-gray-300 hover:bg-gray-50 transition-colors"
    >
      {logoUrl ? (
        <div className="w-full h-full relative">
          <img 
            src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
            alt={`${entityLabel} Logo`} 
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
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload {entityLabel.toLowerCase()} image</h3>
          <p className="mt-1 text-sm text-gray-500">Click to upload a logo or image for your {entityLabel.toLowerCase()}</p>
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

export default ProfessionalImageUpload;


import React, { useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";
import { useSetRecoilState } from "recoil";
import { pharmacyLogoUrlState, doctorLogoUrlState } from "@/store/images/atoms";
import {
  updatePharmacyWorkspaceApi,
  updateDoctorWorkspaceApi,
} from "@/services/professionalWorkspaceApi";

const MAX_BYTES = 750_000;

interface ProfessionalImageUploadProps {
  entityId: string;
  entityType: "doctor" | "pharmacy";
  logoUrl: string | null | undefined;
  onImageUpdate: (newLogoUrl: string) => void;
  userId?: string;
}

const ProfessionalImageUpload: React.FC<ProfessionalImageUploadProps> = ({
  entityType,
  logoUrl,
  onImageUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPharmacyLogoUrl = useSetRecoilState(pharmacyLogoUrlState);
  const setDoctorLogoUrl = useSetRecoilState(doctorLogoUrlState);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose an image under ~750KB (Neon stores logo as data URL).",
      });
      return;
    }

    try {
      setIsUploading(true);
      toast({
        title: "Uploading image",
        description: `Saving your ${entityType} logo…`,
      });

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("read failed"));
        r.readAsDataURL(file);
      });

      if (entityType === "pharmacy") {
        await updatePharmacyWorkspaceApi({ logo_url: dataUrl });
        setPharmacyLogoUrl(dataUrl);
      } else {
        await updateDoctorWorkspaceApi({ logo_url: dataUrl });
        setDoctorLogoUrl(dataUrl);
      }

      onImageUpdate(dataUrl);

      toast({
        title: "Success",
        description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} image updated`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error uploading ${entityType} image:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
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
            src={`${logoUrl}${logoUrl.includes("?") ? "&" : "?"}t=${Date.now()}`}
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
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Upload {entityLabel.toLowerCase()} image
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Click to upload a logo (stored on the server; max ~750KB)
          </p>
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

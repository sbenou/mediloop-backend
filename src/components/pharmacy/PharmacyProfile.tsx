
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, Clock, MapPin, Users, UserCog, User } from "lucide-react";
import PharmacyInfo from "@/components/pharmacy/PharmacyInfo";
import PharmacyHours from "@/components/pharmacy/PharmacyHours";
import PharmacyMap from "@/components/pharmacy/PharmacyMap";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";
import PharmacyStaff from "@/components/pharmacy/PharmacyStaff";
import { useSetRecoilState } from "recoil";
import { pharmacyLogoUrlState } from "@/store/images/atoms";

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  logo_url?: string | null;
}

const PharmacyProfile = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploading, setIsUploading] = useState(false);
  const [pharmacyData, setPharmacyData] = useState<PharmacyData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Get the setter function for the Recoil state
  const setPharmacyLogoUrl = useSetRecoilState(pharmacyLogoUrlState);

  useEffect(() => {
    fetchPharmacyData();
  }, [profile]);

  const fetchPharmacyData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch the pharmacy associated with this pharmacist
      const { data: pharmacyRelation, error: relationError } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', profile.id)
        .single();

      if (relationError || !pharmacyRelation) {
        console.error('Error fetching pharmacy relation:', relationError);
        return;
      }

      // Now fetch the pharmacy details
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacyRelation.pharmacy_id)
        .single();

      if (pharmacyError) {
        console.error('Error fetching pharmacy:', pharmacyError);
        return;
      }

      // Check if pharmacy metadata exists with logo_url
      const { data: pharmacyMetadata, error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .select('logo_url')
        .eq('pharmacy_id', pharmacy.id)
        .maybeSingle();

      let logoUrl = null;
      if (!metadataError && pharmacyMetadata?.logo_url) {
        logoUrl = pharmacyMetadata.logo_url;
        // Set the pharmacy logo in Recoil state when fetched
        setPharmacyLogoUrl(logoUrl);
      }

      setPharmacyData({
        ...pharmacy,
        logo_url: logoUrl
      });
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pharmacyData?.id) return;

    try {
      setIsUploading(true);
      
      // Check if pharmacy-images bucket exists, create if not
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw bucketsError;
      }
      
      const bucketName = 'pharmacy-images';
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createBucketError) {
          throw createBucketError;
        }
      }
      
      // Create a unique filename for the image
      const filePath = `pharmacies/${pharmacyData.id}/${crypto.randomUUID()}`;
      
      // Enable RLS debugging
      console.log('Attempting to upload to:', bucketName, filePath);
      
      const { error: uploadError } = await supabase.storage
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

      // Create or update pharmacy metadata with the logo URL
      const { error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .upsert({ 
          pharmacy_id: pharmacyData.id,
          logo_url: publicUrl
        });

      if (metadataError) {
        console.error('Metadata error:', metadataError);
        throw metadataError;
      }

      // Update local state
      setPharmacyData({
        ...pharmacyData,
        logo_url: publicUrl
      });
      
      // Update the Recoil state for global access
      setPharmacyLogoUrl(publicUrl);

      toast({
        title: "Success",
        description: "Pharmacy image updated successfully",
      });
    } catch (error) {
      console.error('Error uploading pharmacy image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pharmacy image",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!pharmacyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading pharmacy information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Centered Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Profile</h1>
        <p className="text-muted-foreground">
          Manage your pharmacy information, opening hours, and staff.
        </p>
      </div>

      {/* Centered Tabs Navigation */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center justify-center">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center justify-center">
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center justify-center">
              <UserCog className="mr-2 h-4 w-4" />
              Staff Management
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Profile Tab Content - Full Width */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          {/* Pharmacy Image Section */}
          <div 
            onClick={handleImageClick}
            className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden border border-dashed border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {pharmacyData?.logo_url ? (
              <div className="w-full h-full relative">
                <img 
                  src={pharmacyData.logo_url} 
                  alt={pharmacyData.name} 
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

          {/* Pharmacy Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pharmacy Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Pharmacy Information
                </CardTitle>
                <CardDescription>
                  Contact details and address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PharmacyInfo pharmacy={pharmacyData} />
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Opening Hours
                </CardTitle>
                <CardDescription>
                  When your pharmacy is open
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PharmacyHours hours={pharmacyData.hours} pharmacyId={pharmacyData.id} />
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  Pharmacy location on map
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PharmacyMap pharmacy={pharmacyData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Team Tab Content */}
        <TabsContent value="team" className="mt-6">
          <PharmacyTeam pharmacyId={pharmacyData.id} />
        </TabsContent>
          
        {/* Staff Management Tab Content */}
        <TabsContent value="staff" className="mt-6">
          <PharmacyStaff pharmacyId={pharmacyData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PharmacyProfile;

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, Clock, MapPin, Users, UserCog } from "lucide-react";
import PharmacyInfo from "@/components/pharmacy/PharmacyInfo";
import PharmacyHours from "@/components/pharmacy/PharmacyHours";
import PharmacyMap from "@/components/pharmacy/PharmacyMap";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";
import PharmacyStaff from "@/components/pharmacy/PharmacyStaff";

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
  const [activeTab, setActiveTab] = useState("info");
  const [isUploading, setIsUploading] = useState(false);
  const [pharmacyData, setPharmacyData] = useState<PharmacyData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Check if logo_url exists
      const { data: pharmacyMetadata, error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .select('logo_url')
        .eq('pharmacy_id', pharmacy.id)
        .maybeSingle();

      if (!metadataError && pharmacyMetadata) {
        setPharmacyData({
          ...pharmacy,
          logo_url: pharmacyMetadata.logo_url
        });
      } else {
        setPharmacyData({
          ...pharmacy,
          logo_url: null
        });
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    }
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
      
      const filePath = `pharmacies/${pharmacyData.id}/${crypto.randomUUID()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pharmacy-images')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-images')
        .getPublicUrl(filePath);

      // Create or update pharmacy metadata with the logo URL
      const { error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .upsert({ 
          pharmacy_id: pharmacyData.id,
          logo_url: publicUrl
        });

      if (metadataError) throw metadataError;

      // Update local state
      setPharmacyData({
        ...pharmacyData,
        logo_url: publicUrl
      });

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!pharmacyData) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading pharmacy information...</p>
        </div>
      </PharmacistLayout>
    );
  }

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Profile</h1>
          <p className="text-muted-foreground">
            Manage your pharmacy information, opening hours, and staff.
          </p>
        </div>

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

        {/* Team and Staff Management Tabs */}
        <Tabs defaultValue="team" value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="team" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center">
              <UserCog className="mr-2 h-4 w-4" />
              Staff Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="mt-6">
            <PharmacyTeam pharmacyId={pharmacyData.id} />
          </TabsContent>
          
          <TabsContent value="staff" className="mt-6">
            <PharmacyStaff pharmacyId={pharmacyData.id} />
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyProfile;

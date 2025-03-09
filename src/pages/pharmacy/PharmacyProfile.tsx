
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, Clock, MapPin, Users, UserCog, AlertTriangle, Store, Edit, MoreVertical } from 'lucide-react';
import PharmacyInfo from "@/components/pharmacy/PharmacyInfo";
import PharmacyHours from "@/components/pharmacy/PharmacyHours";
import PharmacyMap from "@/components/pharmacy/PharmacyMap";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";
import PharmacyStaff from "@/components/pharmacy/PharmacyStaff";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);

  useEffect(() => {
    fetchPharmacyData();
  }, [profile?.id]);

  const fetchPharmacyData = async () => {
    if (!profile?.id) {
      setIsLoading(false);
      setError("User profile not loaded");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching pharmacy data for user:", profile.id);

      const { data: pharmacyRelation, error: relationError } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (relationError) {
        console.error('Error fetching pharmacy relation:', relationError);
        setError("Failed to fetch pharmacy relationship");
        setIsLoading(false);
        return;
      }

      if (!pharmacyRelation || !pharmacyRelation.pharmacy_id) {
        console.log("No pharmacy associated with this user:", profile.id);
        setError("No pharmacy associated with your account");
        setIsLoading(false);
        return;
      }

      console.log("Found pharmacy relation:", pharmacyRelation);

      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', pharmacyRelation.pharmacy_id)
        .maybeSingle();

      if (pharmacyError) {
        console.error('Error fetching pharmacy:', pharmacyError);
        setError("Failed to fetch pharmacy details");
        setIsLoading(false);
        return;
      }

      if (!pharmacy) {
        console.log("Pharmacy not found for ID:", pharmacyRelation.pharmacy_id);
        setError("Pharmacy not found");
        setIsLoading(false);
        return;
      }

      console.log("Fetched pharmacy data:", pharmacy);

      const { data: pharmacyMetadata, error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .select('logo_url')
        .eq('pharmacy_id', pharmacy.id)
        .maybeSingle();

      if (metadataError) {
        console.error('Error fetching pharmacy metadata:', metadataError);
      }

      setPharmacyData({
        ...pharmacy,
        logo_url: pharmacyMetadata?.logo_url || null
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
      setError("An unexpected error occurred");
      setIsLoading(false);
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
      
      // Create a unique file path with proper extension
      const fileExt = file.name.split('.').pop();
      const filePath = `pharmacies/${pharmacyData.id}/${crypto.randomUUID()}.${fileExt}`;
      
      console.log("Uploading to pharmacy-images bucket:", filePath);
      console.log("File type:", file.type);
      console.log("File size:", file.size);
      
      // Upload the file with content type
      const { error: uploadError, data } = await supabase.storage
        .from('pharmacy-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Upload successful, getting public URL");
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-images')
        .getPublicUrl(filePath);

      console.log("Public URL obtained:", publicUrl);

      // Update pharmacy metadata with new logo URL
      const { error: metadataError } = await supabase
        .from('pharmacy_metadata')
        .upsert({ 
          pharmacy_id: pharmacyData.id,
          logo_url: publicUrl
        });

      if (metadataError) {
        console.error('Metadata update error:', metadataError);
        throw new Error(`Metadata update failed: ${metadataError.message}`);
      }

      console.log("Pharmacy metadata updated successfully");

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
        description: error instanceof Error ? error.message : "Failed to update pharmacy image",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-muted-foreground">Loading pharmacy information...</p>
          </div>
        </div>
      </PharmacistLayout>
    );
  }

  if (error) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center px-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold">Pharmacy Data Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchPharmacyData} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </PharmacistLayout>
    );
  }

  if (!pharmacyData) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center px-4">
            <Store className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No Pharmacy Found</h2>
            <p className="text-muted-foreground">
              There is no pharmacy associated with your account. Please contact an administrator.
            </p>
          </div>
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
                <Button variant="outline" className="bg-white/80" disabled={isUploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Change Image'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Image className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload pharmacy image</h3>
              <p className="mt-1 text-sm text-gray-500">Click to upload a logo or image for your pharmacy</p>
              {isUploading && <p className="mt-2 text-sm text-blue-500">Uploading...</p>}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Pharmacy Information
                </CardTitle>
                <CardDescription>
                  Contact details and address
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditingInfo(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Information
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {isEditingInfo ? (
                <PharmacyInfo pharmacy={pharmacyData} />
              ) : (
                <PharmacyInfo pharmacy={pharmacyData} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Opening Hours
                </CardTitle>
                <CardDescription>
                  When your pharmacy is open
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditingHours(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Hours
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <PharmacyHours hours={pharmacyData.hours} pharmacyId={pharmacyData.id} />
            </CardContent>
          </Card>

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

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, Clock, MapPin, Users, UserCog, AlertTriangle, Store, Edit, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PharmacyTeam from "@/components/pharmacy/PharmacyTeam";
import PharmacyStaff from "@/components/pharmacy/PharmacyStaff";
import PharmacyHours from "@/components/pharmacy/PharmacyHours";
import PharmacyMap from "@/components/pharmacy/PharmacyMap";
import PharmacyInfo from "@/components/pharmacy/PharmacyInfo";

interface ProfessionalData {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  logo_url?: string | null;
}

interface UniversalProfessionalProfileProps {
  userRole: 'doctor' | 'pharmacist';
}

const UniversalProfessionalProfile = ({ userRole }: UniversalProfessionalProfileProps) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUploading, setIsUploading] = useState(false);
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);

  const entityType = userRole === 'doctor' ? 'doctor' : 'pharmacy';
  const Layout = userRole === 'doctor' ? DoctorLayout : PharmacistLayout;

  useEffect(() => {
    fetchProfessionalData();
  }, [profile?.id]);

  const fetchProfessionalData = async () => {
    if (!profile?.id) {
      setIsLoading(false);
      setError("User profile not loaded");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching ${entityType} data for user:`, profile.id);

      // First, determine the relation table name based on user role
      const relationTable = userRole === 'doctor' ? 'user_pharmacies' : 'user_pharmacies';
      
      // Get the relation between user and professional entity
      let relationQuery;
      if (userRole === 'doctor') {
        // For doctors, we'll mock the data since the table doesn't exist yet
        // In a real scenario, we'd query the user_doctors table
        const doctorId = profile.id; // Use profile ID as doctor ID for demo
        
        // For now, in our demo, we'll create a mock doctor record that matches pharmacy structure
        const mockDoctorData: ProfessionalData = {
          id: doctorId,
          name: profile.full_name || 'Doctor Practice',
          address: '123 Doctor Street',
          city: profile.city || 'Doctor City',
          postal_code: '12345',
          phone: null,
          hours: null,
        };
        
        setProfessionalData(mockDoctorData);
        setIsLoading(false);
        return;
        
      } else {
        // For pharmacists, use the existing table
        relationQuery = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', profile.id)
          .maybeSingle();
          
        if (relationQuery.error) {
          console.error(`Error fetching pharmacy relation:`, relationQuery.error);
          setError(`Failed to fetch pharmacy relationship`);
          setIsLoading(false);
          return;
        }
        
        if (!relationQuery.data || !relationQuery.data.pharmacy_id) {
          console.log(`No pharmacy associated with this user:`, profile.id);
          setError(`No pharmacy associated with your account`);
          setIsLoading(false);
          return;
        }
        
        console.log(`Found pharmacy relation:`, relationQuery.data);
        
        const pharmacyId = relationQuery.data.pharmacy_id;
        
        // Get the pharmacy data
        const pharmacyQuery = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', pharmacyId)
          .maybeSingle();
        
        if (pharmacyQuery.error) {
          console.error(`Error fetching pharmacy:`, pharmacyQuery.error);
          setError(`Failed to fetch pharmacy details`);
          setIsLoading(false);
          return;
        }
        
        if (!pharmacyQuery.data) {
          console.log(`Pharmacy not found for ID:`, pharmacyId);
          setError(`Pharmacy not found`);
          setIsLoading(false);
          return;
        }
        
        console.log(`Fetched pharmacy data:`, pharmacyQuery.data);
        
        // Get pharmacy metadata (like logo)
        const metadataQuery = await supabase
          .from('pharmacy_metadata')
          .select('logo_url')
          .eq('pharmacy_id', pharmacyId)
          .maybeSingle();
          
        let logoUrl = null;
        if (!metadataQuery.error && metadataQuery.data) {
          logoUrl = metadataQuery.data.logo_url;
        } else {
          console.error(`Error or no data fetching pharmacy metadata:`, metadataQuery.error);
        }
        
        const pharmacyData = {
          ...pharmacyQuery.data,
          logo_url: logoUrl
        };
        
        setProfessionalData(pharmacyData as ProfessionalData);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`Error fetching ${entityType} data:`, error);
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
    if (!file || !professionalData?.id) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${entityType}s/${professionalData.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const storageBucket = userRole === 'doctor' ? 'doctor-images' : 'pharmacy-images';
      
      console.log(`Uploading to ${storageBucket} bucket:`, filePath);
      console.log("File type:", file.type);
      console.log("File size:", file.size);
      
      // Real upload for all user types - the buckets are already created with SQL
      const { error: uploadError, data } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Upload successful, getting public URL");
      
      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);
        
      // Add cache-busting parameter to prevent caching issues
      const cachebustedUrl = `${publicUrl}?t=${Date.now()}`;

      console.log("Public URL obtained:", cachebustedUrl);
      
      // Update metadata for the appropriate entity
      if (userRole === 'pharmacist') {
        const { error: metadataError } = await supabase
          .from('pharmacy_metadata')
          .upsert({ 
            pharmacy_id: professionalData.id,
            logo_url: cachebustedUrl
          });

        if (metadataError) {
          console.error('Metadata update error:', metadataError);
          throw new Error(`Metadata update failed: ${metadataError.message}`);
        }
        console.log(`Pharmacy metadata updated successfully`);
      } else {
        // For doctors, update the doctor's profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: cachebustedUrl 
          })
          .eq('id', professionalData.id);
          
        if (profileError) {
          console.error('Doctor profile update error:', profileError);
          throw new Error(`Profile update failed: ${profileError.message}`);
        }
        console.log(`Doctor profile updated successfully`);
      }

      setProfessionalData({
        ...professionalData,
        logo_url: cachebustedUrl
      });

      toast({
        title: "Success",
        description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} image updated successfully`,
      });
    } catch (error) {
      console.error(`Error uploading ${entityType} image:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to update ${entityType} image`,
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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-muted-foreground">Loading {entityType} information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center px-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold">{entityType} Data Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchProfessionalData} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!professionalData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center px-4">
            <Store className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No {entityType} Found</h2>
            <p className="text-muted-foreground">
              There is no {entityType} associated with your account. Please contact an administrator.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{entityType === 'doctor' ? 'Doctor Profile' : 'Pharmacy Profile'}</h1>
          <p className="text-muted-foreground">
            Manage your {entityType} information, opening hours, and staff.
          </p>
        </div>

        {/* Tabs with centered list */}
        <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList>
              <TabsTrigger value="profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center">
                <UserCog className="mr-2 h-4 w-4" />
                Staff Management
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile" className="mt-6">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">{entityType === 'doctor' ? 'Doctor Details' : 'Pharmacy Details'}</h3>
              </div>
              
              <div 
                onClick={handleImageClick}
                className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden border border-dashed border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {professionalData?.logo_url ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={professionalData.logo_url} 
                      alt={professionalData.name} 
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
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Upload {entityType} image</h3>
                    <p className="mt-1 text-sm text-gray-500">Click to upload a logo or image for your {entityType}</p>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card className="h-full">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <Users className="mr-2 h-5 w-5" />
                        {entityType === 'doctor' ? 'Doctor Information' : 'Pharmacy Information'}
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
                    <PharmacyInfo pharmacy={professionalData} />
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <Clock className="mr-2 h-5 w-5" />
                        Opening Hours
                      </CardTitle>
                      <CardDescription>
                        When your {entityType} is open
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
                    <PharmacyHours hours={professionalData.hours} pharmacyId={professionalData.id} />
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <MapPin className="mr-2 h-5 w-5" />
                        Location
                      </CardTitle>
                      <CardDescription>
                        {entityType} location and distance
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PharmacyMap pharmacy={professionalData} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Team Tab Content */}
          <TabsContent value="team" className="mt-6">
            <PharmacyTeam 
              pharmacyId={professionalData.id}
              entityType={entityType}
            />
          </TabsContent>
          
          {/* Staff Management Tab Content */}
          <TabsContent value="staff" className="mt-6">
            <div className="container mx-auto px-4">
              <PharmacyStaff 
                pharmacyId={professionalData.id}
                entityType={entityType}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UniversalProfessionalProfile;

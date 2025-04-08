
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRecoilState } from "recoil";
import { pharmacyLogoUrlState, doctorLogoUrlState } from "@/store/images/atoms";

// Import our unified components
import ProfessionalHeader from "./profile/ProfessionalHeader";
import ProfessionalTabs from "./profile/ProfessionalTabs";
import PharmacyProfileContent from "@/components/pharmacy/profile/PharmacyProfileContent";
import DoctorProfileContent from "@/components/doctor/profile/DoctorProfileContent";
import ProfessionalTeamContent from "./profile/ProfessionalTeamContent";
import ProfessionalStaffContent from "./profile/ProfessionalStaffContent";

interface EntityData {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  logo_url?: string | null;
  email?: string;
}

interface DoctorMetadata {
  id: string;
  doctor_id: string | null;
  logo_url: string | null;
  hours: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProfessionalProfileProps {
  role: 'doctor' | 'pharmacy';
}

const ProfessionalProfile: React.FC<ProfessionalProfileProps> = ({ role }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  
  // Get the appropriate logo state based on role
  const [logoUrl, setLogoUrl] = useRecoilState(
    role === 'doctor' ? doctorLogoUrlState : pharmacyLogoUrlState
  );
  
  useEffect(() => {
    fetchEntityData();
  }, [profile, role]);

  const fetchEntityData = async () => {
    if (!profile?.id) return;

    try {
      console.log(`Fetching ${role} data for user:`, profile.id);
      
      // Table and field names based on role
      const relationTable = role === 'doctor' ? 'user_doctors' : 'user_pharmacies';
      const entityIdField = role === 'doctor' ? 'doctor_id' : 'pharmacy_id';
      const entityTable = role === 'doctor' ? 'doctors' : 'pharmacies';
      const metadataTable = role === 'doctor' ? 'doctor_metadata' : 'pharmacy_metadata';
      const profileLogoField = role === 'doctor' ? 'doctor_logo_url' : 'pharmacy_logo_url';
      const profileNameField = role === 'doctor' ? 'doctor_name' : 'pharmacy_name';
      
      let entityId: string;
      
      if (role === 'pharmacy') {
        // For pharmacy users - fetch their associated pharmacy
        const { data: pharmacyRelation, error: relationError } = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', profile.id)
          .single();
          
        if (relationError || !pharmacyRelation) {
          console.error('Error fetching pharmacy relation:', relationError);
          return;
        }
        
        entityId = pharmacyRelation.pharmacy_id;
        console.log("Found pharmacy relation with ID:", entityId);
        
        // Fetch pharmacy details
        const { data: pharmacy, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('id', entityId)
          .single();
          
        if (pharmacyError || !pharmacy) {
          console.error('Error fetching pharmacy:', pharmacyError);
          return;
        }
        
        console.log("Fetched pharmacy data:", pharmacy);
        
        // Fetch logo from pharmacy_metadata if available
        const { data: metadata, error: metadataError } = await supabase
          .from('pharmacy_metadata')
          .select('logo_url')
          .eq('pharmacy_id', pharmacy.id)
          .maybeSingle();
          
        let logoUrl = null;
        if (!metadataError && metadata?.logo_url) {
          logoUrl = metadata.logo_url;
          setLogoUrl(logoUrl);
        } else if (profile.pharmacy_logo_url) {
          logoUrl = profile.pharmacy_logo_url;
          setLogoUrl(logoUrl);
          
          // Update metadata with logo from profile
          if (logoUrl) {
            await supabase
              .from('pharmacy_metadata')
              .upsert({ 
                pharmacy_id: pharmacy.id, 
                logo_url: logoUrl 
              });
          }
        }
        
        setEntityData({
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          city: pharmacy.city,
          postal_code: pharmacy.postal_code,
          phone: pharmacy.phone,
          hours: pharmacy.hours,
          logo_url: logoUrl,
          email: profile.email || ''
        });
        
        // Update profile with pharmacy name and logo
        if (pharmacy?.name) {
          await supabase
            .from('profiles')
            .update({ 
              pharmacy_name: pharmacy.name,
              pharmacy_logo_url: logoUrl
            })
            .eq('id', profile.id);
        }
      } else {
        // For doctors - use profile.id as the entityId
        entityId = profile.id;
        
        // Check for existing doctor_metadata
        try {
          // Get profile information
          const profileInfo = {
            full_name: profile.full_name || "Doctor",
            email: profile.email || "",
            phone: profile.phone_number || null
          };
          
          // Fetch doctor_metadata to get address information
          const { data: metadata } = await supabase
            .from('doctor_metadata')
            .select('*')
            .eq('doctor_id', entityId)
            .maybeSingle();
          
          let doctorLogoUrl = null;
          let address = '';
          let city = '';
          let postal_code = '';
          let hours = null;
          
          if (metadata) {
            console.log("Found doctor metadata:", metadata);
            doctorLogoUrl = metadata.logo_url;
            
            // Since doctor_metadata might not have address fields directly,
            // use the address fields if they exist, otherwise default to empty strings
            address = metadata.address || '';
            city = metadata.city || '';
            postal_code = metadata.postal_code || '';
            hours = metadata.hours;
            
            if (doctorLogoUrl) {
              setLogoUrl(doctorLogoUrl);
            } else if (profile.doctor_stamp_url) {
              doctorLogoUrl = profile.doctor_stamp_url;
              setLogoUrl(doctorLogoUrl);
              
              // Update doctor_metadata with the logo from profile
              if (doctorLogoUrl) {
                try {
                  await supabase
                    .from('doctor_metadata')
                    .update({ logo_url: doctorLogoUrl })
                    .eq('doctor_id', entityId);
                } catch (metaError) {
                  console.error("Error updating doctor_metadata logo:", metaError);
                }
              }
            }
          } else {
            console.log("No doctor metadata found, checking for doctor_stamp_url");
            // No metadata found, use doctor_stamp_url as a fallback for logo
            if (profile.doctor_stamp_url) {
              doctorLogoUrl = profile.doctor_stamp_url;
              setLogoUrl(doctorLogoUrl);
              
              // Create doctor_metadata entry with the logo from profile
              try {
                await supabase
                  .from('doctor_metadata')
                  .insert({ 
                    doctor_id: entityId, 
                    logo_url: doctorLogoUrl 
                  });
              } catch (metaError) {
                console.error("Error creating doctor_metadata:", metaError);
              }
            }
          }
        
          // Create entity data with combined profile and metadata information
          setEntityData({
            id: profile.id,
            name: profileInfo.full_name,
            address: address,
            city: city,
            postal_code: postal_code,
            phone: profileInfo.phone,
            hours: hours,
            logo_url: doctorLogoUrl,
            email: profileInfo.email
          });
          
          console.log("Set doctor entity data:", {
            id: profile.id,
            name: profileInfo.full_name,
            address: address,
            city: city,
            postal_code: postal_code,
            logo_url: doctorLogoUrl,
            email: profileInfo.email
          });
          
        } catch (error) {
          console.error("Error fetching doctor profile or metadata:", error);
          
          // Still create entity data even if there was an error
          setEntityData({
            id: profile.id,
            name: profile.full_name || "Doctor",
            address: "",
            city: "",
            postal_code: "",
            phone: null,
            hours: null,
            logo_url: profile.doctor_stamp_url,
            email: profile.email || ""
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching ${role} data:`, error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleLogoUpdate = (newLogoUrl: string) => {
    // Update local state
    if (entityData) {
      setEntityData({
        ...entityData,
        logo_url: newLogoUrl
      });
    }
    
    // Update the appropriate Recoil state
    setLogoUrl(newLogoUrl);
  };

  const getHeaderTitle = () => {
    return role === 'doctor' ? 'Doctor Profile' : 'Pharmacy Profile';
  };
  
  const getHeaderDescription = () => {
    return role === 'doctor' 
      ? 'Manage your doctor information, availability, and staff.'
      : 'Manage your pharmacy information, opening hours, and staff.';
  };

  if (!entityData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading {role} information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Centered Header Section */}
      <ProfessionalHeader 
        title={getHeaderTitle()}
        description={getHeaderDescription()}
        role={role}
      />

      {/* Centered Tabs Navigation */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <ProfessionalTabs activeTab={activeTab} onTabChange={handleTabChange} role={role} />
        
        {/* Profile Tab Content - Full Width */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          {role === 'pharmacy' ? (
            <PharmacyProfileContent 
              pharmacyData={entityData} 
              userId={profile?.id}
              onLogoUpdate={handleLogoUpdate}
            />
          ) : (
            <DoctorProfileContent
              doctorData={entityData}
              userId={profile?.id}
              onLogoUpdate={handleLogoUpdate}
            />
          )}
        </TabsContent>
        
        {/* Team Tab Content */}
        <TabsContent value="team" className="mt-6">
          <ProfessionalTeamContent entityId={entityData.id} entityType={role} />
        </TabsContent>
          
        {/* Staff Management Tab Content */}
        <TabsContent value="staff" className="mt-6">
          <ProfessionalStaffContent entityId={entityData.id} entityType={role} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalProfile;

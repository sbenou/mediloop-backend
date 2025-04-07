
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
      
      let entityId: string | null = null;
      
      if (role === 'pharmacy') {
        // For pharmacy - use the existing code
        const { data: relation, error } = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', profile.id)
          .single();
          
        if (error || !relation) {
          console.error('Error fetching pharmacy relation:', error);
          return;
        }
        
        entityId = relation.pharmacy_id;
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
          logo_url: logoUrl
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
        // For doctors - use profile.id as the entityId temporarily
        entityId = profile.id;
        
        // Check for existing doctor_metadata
        const { data: metadata, error: metadataError } = await supabase
          .from('doctor_metadata')
          .select('logo_url')
          .eq('doctor_id', entityId)
          .maybeSingle();
        
        let doctorLogoUrl = null;
        if (!metadataError && metadata?.logo_url) {
          doctorLogoUrl = metadata.logo_url;
          setLogoUrl(doctorLogoUrl);
        } else if (profile.doctor_stamp_url) {
          doctorLogoUrl = profile.doctor_stamp_url;
          setLogoUrl(doctorLogoUrl);
          
          // Update doctor_metadata with the logo from profile
          if (doctorLogoUrl) {
            // Attempt to create/update doctor_metadata entry
            try {
              await supabase
                .from('doctor_metadata')
                .upsert({ 
                  doctor_id: entityId, 
                  logo_url: doctorLogoUrl 
                });
            } catch (metaError) {
              console.log("Note: doctor_metadata table might not exist yet:", metaError);
            }
          }
        }
        
        // Create placeholder entity data based on profile info
        setEntityData({
          id: profile.id,
          name: profile.full_name || "Doctor",
          address: "Office address",
          city: "City",
          postal_code: "Postal code",
          phone: null,
          hours: null,
          logo_url: doctorLogoUrl
        });
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

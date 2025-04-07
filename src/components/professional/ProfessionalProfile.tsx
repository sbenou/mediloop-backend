
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
      
      // Table and field names based on role
      const relationTable = role === 'doctor' ? 'user_doctors' : 'user_pharmacies';
      const entityIdField = role === 'doctor' ? 'doctor_id' : 'pharmacy_id';
      const entityTable = role === 'doctor' ? 'doctors' : 'pharmacies';
      const metadataTable = role === 'doctor' ? 'doctor_metadata' : 'pharmacy_metadata';
      const profileLogoField = role === 'doctor' ? 'doctor_logo_url' : 'pharmacy_logo_url';
      const profileNameField = role === 'doctor' ? 'doctor_name' : 'pharmacy_name';
      
      // Fetch the entity associated with this professional
      const { data: entityRelation, error: relationError } = await supabase
        .from(relationTable)
        .select(entityIdField)
        .eq('user_id', profile.id)
        .single();

      if (relationError || !entityRelation) {
        console.error(`Error fetching ${role} relation:`, relationError);
        return;
      }

      const entityId = entityRelation[entityIdField];
      console.log(`Found ${role} relation with ${entityIdField}:`, entityId);

      // Now fetch the entity details
      const { data: entity, error: entityError } = await supabase
        .from(entityTable)
        .select('*')
        .eq('id', entityId)
        .single();

      if (entityError) {
        console.error(`Error fetching ${role}:`, entityError);
        return;
      }

      console.log(`Fetched ${role} data:`, entity);

      // Check if entity metadata exists with logo_url
      const { data: entityMetadata, error: metadataError } = await supabase
        .from(metadataTable)
        .select('logo_url')
        .eq(`${role}_id`, entity.id)
        .maybeSingle();

      let logoUrl = null;
      if (!metadataError && entityMetadata?.logo_url) {
        logoUrl = entityMetadata.logo_url;
        
        // Set the logo in Recoil state when fetched
        console.log(`Setting ${role} logo from metadata:`, logoUrl);
        setLogoUrl(logoUrl);
      } else {
        // If no logo in metadata, check if it's in the profile
        if (profile?.[profileLogoField]) {
          logoUrl = profile[profileLogoField];
          console.log(`Using ${role} logo from profile:`, logoUrl);
          setLogoUrl(logoUrl);
          
          // Also update metadata if we have a logo in the profile
          if (logoUrl) {
            console.log(`Updating ${metadataTable} with logo from profile`);
            await supabase
              .from(metadataTable)
              .upsert({ 
                [`${role}_id`]: entity.id, 
                logo_url: logoUrl 
              });
          }
        }
      }

      setEntityData({
        ...entity,
        logo_url: logoUrl
      });
      
      // Update profile with entity name and logo for sidebar display
      if (entity?.name) {
        await supabase
          .from('profiles')
          .update({ 
            [profileNameField]: entity.name,
            [profileLogoField]: logoUrl
          })
          .eq('id', profile.id);
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
          <PharmacyProfileContent 
            pharmacyData={entityData} 
            userId={profile?.id}
            onLogoUpdate={handleLogoUpdate}
          />
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

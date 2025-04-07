
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRecoilState } from "recoil";
import { pharmacyLogoUrlState } from "@/store/images/atoms";

// Import our new components
import PharmacyHeader from "./profile/PharmacyHeader";
import PharmacyTabs from "./profile/PharmacyTabs";
import PharmacyProfileContent from "./profile/PharmacyProfileContent";
import PharmacyTeamContent from "./profile/PharmacyTeamContent";
import PharmacyStaffContent from "./profile/PharmacyStaffContent";

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
  const [pharmacyData, setPharmacyData] = useState<PharmacyData | null>(null);
  // Get the setter function for the Recoil state
  const [pharmacyLogoUrl, setPharmacyLogoUrl] = useRecoilState(pharmacyLogoUrlState);
  
  useEffect(() => {
    fetchPharmacyData();
  }, [profile]);

  const fetchPharmacyData = async () => {
    if (!profile?.id) return;

    try {
      console.log("Fetching pharmacy data for user:", profile.id);
      
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

      console.log("Found pharmacy relation with pharmacy_id:", pharmacyRelation.pharmacy_id);

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

      console.log("Fetched pharmacy data:", pharmacy);

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
        console.log("Setting pharmacy logo from metadata:", logoUrl);
        setPharmacyLogoUrl(logoUrl);
      } else {
        // If no logo in metadata, check if it's in the profile
        if (profile?.pharmacy_logo_url) {
          logoUrl = profile.pharmacy_logo_url;
          console.log("Using pharmacy logo from profile:", logoUrl);
          setPharmacyLogoUrl(logoUrl);
          
          // Also update metadata if we have a logo in the profile
          if (logoUrl) {
            console.log("Updating pharmacy_metadata with logo from profile");
            await supabase
              .from('pharmacy_metadata')
              .upsert({ 
                pharmacy_id: pharmacy.id, 
                logo_url: logoUrl 
              });
          }
        }
      }

      setPharmacyData({
        ...pharmacy,
        logo_url: logoUrl
      });
      
      // Update profile with pharmacy name and logo for sidebar display
      if (pharmacy?.name) {
        await supabase
          .from('profiles')
          .update({ 
            pharmacy_name: pharmacy.name,
            pharmacy_logo_url: logoUrl
          })
          .eq('id', profile.id);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleLogoUpdate = (newLogoUrl: string) => {
    // Update local state
    if (pharmacyData) {
      setPharmacyData({
        ...pharmacyData,
        logo_url: newLogoUrl
      });
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
      <PharmacyHeader 
        title="Pharmacy Profile"
        description="Manage your pharmacy information, opening hours, and staff."
      />

      {/* Centered Tabs Navigation */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <PharmacyTabs activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Profile Tab Content - Full Width */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <PharmacyProfileContent 
            pharmacyData={pharmacyData} 
            userId={profile?.id}
            onLogoUpdate={handleLogoUpdate}
          />
        </TabsContent>
        
        {/* Team Tab Content */}
        <TabsContent value="team" className="mt-6">
          <PharmacyTeamContent pharmacyId={pharmacyData.id} />
        </TabsContent>
          
        {/* Staff Management Tab Content */}
        <TabsContent value="staff" className="mt-6">
          <PharmacyStaffContent pharmacyId={pharmacyData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PharmacyProfile;

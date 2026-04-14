
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRecoilState } from "recoil";
import { pharmacyLogoUrlState } from "@/store/images/atoms";
import {
  fetchPharmacyWorkspaceApi,
} from "@/services/professionalWorkspaceApi";

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
  email?: string | null;
}

const PharmacyProfile = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [pharmacyData, setPharmacyData] = useState<PharmacyData | null>(null);
  const [, setPharmacyLogoUrl] = useRecoilState(pharmacyLogoUrlState);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const p = await fetchPharmacyWorkspaceApi();
      const logoUrl = p.logo_url ?? null;
      if (logoUrl) setPharmacyLogoUrl(logoUrl);
      setPharmacyData({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        postal_code: p.postal_code,
        phone: p.phone,
        hours: p.hours,
        logo_url: logoUrl,
        email: p.email ?? undefined,
      });
    } catch (e) {
      console.error("Error fetching pharmacy data:", e);
      setPharmacyData(null);
    }
  }, [profile?.id, setPharmacyLogoUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleLogoUpdate = (newLogoUrl: string) => {
    if (pharmacyData) {
      setPharmacyData({
        ...pharmacyData,
        logo_url: newLogoUrl,
      });
    }
    setPharmacyLogoUrl(newLogoUrl);
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
      <PharmacyHeader
        title="Pharmacy Profile"
        description="Manage your pharmacy information, opening hours, and staff."
      />

      <Tabs defaultValue="profile" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <PharmacyTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <TabsContent value="profile" className="mt-6 space-y-6">
          <PharmacyProfileContent
            pharmacyData={pharmacyData}
            userId={profile?.id}
            onLogoUpdate={handleLogoUpdate}
            onSaved={load}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <PharmacyTeamContent pharmacyId={pharmacyData.id} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <PharmacyStaffContent pharmacyId={pharmacyData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PharmacyProfile;

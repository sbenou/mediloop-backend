import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRecoilState } from "recoil";
import { pharmacyLogoUrlState, doctorLogoUrlState } from "@/store/images/atoms";
import {
  fetchPharmacyWorkspaceApi,
  fetchDoctorWorkspaceApi,
} from "@/services/professionalWorkspaceApi";

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

interface ProfessionalProfileProps {
  role: "doctor" | "pharmacy";
}

const ProfessionalProfile: React.FC<ProfessionalProfileProps> = ({ role }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [entityData, setEntityData] = useState<EntityData | null>(null);

  const [, setLogoUrl] = useRecoilState(
    role === "doctor" ? doctorLogoUrlState : pharmacyLogoUrlState,
  );

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      if (role === "pharmacy") {
        const p = await fetchPharmacyWorkspaceApi();
        const lu = p.logo_url ?? null;
        if (lu) setLogoUrl(lu);
        setEntityData({
          id: p.id,
          name: p.name,
          address: p.address,
          city: p.city,
          postal_code: p.postal_code,
          phone: p.phone,
          hours: p.hours,
          logo_url: lu,
          email: p.email ?? profile.email ?? "",
        });
      } else {
        const d = await fetchDoctorWorkspaceApi();
        const meta = d.metadata || {};
        const lu =
          (meta.logo_url as string | null | undefined) ?? null;
        if (lu) setLogoUrl(lu);
        setEntityData({
          id: d.user.id,
          name: d.user.full_name || "Doctor",
          address: (meta.address as string) || "",
          city: (meta.city as string) || "",
          postal_code: (meta.postal_code as string) || "",
          phone: d.user.phone,
          hours: (meta.hours as string | null) ?? null,
          logo_url: lu,
          email: d.user.email ?? profile.email ?? "",
        });
      }
    } catch (e) {
      console.error(`Error fetching ${role} workspace:`, e);
      setEntityData(null);
    }
  }, [profile?.id, profile?.email, role, setLogoUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleLogoUpdate = (newLogoUrl: string) => {
    if (entityData) {
      setEntityData({
        ...entityData,
        logo_url: newLogoUrl,
      });
    }
    setLogoUrl(newLogoUrl);
  };

  const getHeaderTitle = () => {
    return role === "doctor" ? "Doctor Profile" : "Pharmacy Profile";
  };

  const getHeaderDescription = () => {
    return role === "doctor"
      ? "Manage your doctor information, availability, and staff."
      : "Manage your pharmacy information, opening hours, and staff.";
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
      <ProfessionalHeader
        title={getHeaderTitle()}
        description={getHeaderDescription()}
        role={role}
      />

      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <ProfessionalTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          role={role}
        />

        <TabsContent value="profile" className="mt-6 space-y-6">
          {role === "pharmacy" ? (
            <PharmacyProfileContent
              pharmacyData={entityData}
              userId={profile?.id}
              onLogoUpdate={handleLogoUpdate}
              onSaved={load}
            />
          ) : (
            <DoctorProfileContent
              doctorData={entityData}
              userId={profile?.id}
              onLogoUpdate={handleLogoUpdate}
              onSaved={load}
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <ProfessionalTeamContent entityId={entityData.id} entityType={role} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <ProfessionalStaffContent entityId={entityData.id} entityType={role} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalProfile;

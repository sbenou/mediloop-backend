
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PersonalDetails from "@/components/settings/PersonalDetails";
import AddressManagement from "@/components/settings/AddressManagement";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";
import ProfessionalStampSignature from "@/components/settings/profile/ProfessionalStampSignature";
import { UserRole } from "@/types/role";
import { useRecoilValue } from "recoil";
import { 
  doctorStampUrlState, 
  doctorSignatureUrlState,
  pharmacistStampUrlState,
  pharmacistSignatureUrlState 
} from "@/store/images/atoms";
import PharmacyTeamContent from "@/components/pharmacy/profile/PharmacyTeamContent";
import ProfessionalTeamContent from "@/components/professional/profile/ProfessionalTeamContent";

interface UniversalProfessionalProfileProps {
  userRole: "doctor" | "pharmacist";
  renderLayout?: boolean;
}

const UniversalProfessionalProfile: React.FC<UniversalProfessionalProfileProps> = ({ 
  userRole,
  renderLayout = true 
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const activeTab = searchParams.get("tab") || "personal";
  
  // Get appropriate stamp and signature URLs based on role
  const stampUrl = userRole === "doctor" 
    ? useRecoilValue(doctorStampUrlState) 
    : useRecoilValue(pharmacistStampUrlState);
    
  const signatureUrl = userRole === "doctor"
    ? useRecoilValue(doctorSignatureUrlState)
    : useRecoilValue(pharmacistSignatureUrlState);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Determine tabs based on role
  const getTabs = () => {
    const tabs = [
      { id: 'personal', label: 'Personal Info' },
      { id: 'addresses', label: 'Addresses' },
      { id: 'nextofkin', label: 'Next of Kin' },
      { id: 'stamp', label: 'Stamp & Signature' },
      { id: 'team', label: 'Team' },
      { id: 'staff', label: 'Staff Management' }
    ];
    
    if (userRole === "doctor") {
      tabs.push({ id: 'qualifications', label: 'Qualifications' });
      tabs.push({ id: 'clinic', label: 'Clinic Details' });
    }
    
    return tabs;
  };

  const tabs = getTabs();

  const content = (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{userRole === "doctor" ? "Doctor" : "Pharmacist"} Profile</h1>
        <p className="text-muted-foreground">
          Manage your professional profile and credentials.
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="personal" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <PersonalDetails />
          </div>
        </TabsContent>
        
        <TabsContent value="addresses" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Addresses</h2>
            <AddressManagement />
          </div>
        </TabsContent>
        
        <TabsContent value="nextofkin" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Next of Kin</h2>
            <NextOfKinManagement />
          </div>
        </TabsContent>
        
        <TabsContent value="stamp" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Stamp & Signature</h2>
            <ProfessionalStampSignature 
              userRole={userRole === "doctor" ? UserRole.Doctor : UserRole.Pharmacist}
              stampUrl={stampUrl || profile?.[userRole === "doctor" ? "doctor_stamp_url" : "pharmacist_stamp_url"] || null} 
              signatureUrl={signatureUrl || profile?.[userRole === "doctor" ? "doctor_signature_url" : "pharmacist_signature_url"] || null} 
            />
          </div>
        </TabsContent>
        
        <TabsContent value="team" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Team</h2>
            {userRole === "doctor" ? (
              <ProfessionalTeamContent 
                entityId={profile?.id || ""} 
                entityType="doctor" 
              />
            ) : (
              <PharmacyTeamContent 
                pharmacyId={profile?.pharmacy_id || ""} 
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="staff" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Staff Management</h2>
            <p>Your staff management will be displayed here.</p>
          </div>
        </TabsContent>
        
        {userRole === "doctor" && (
          <>
            <TabsContent value="qualifications" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
                <p>Your medical qualifications and certifications will be displayed here.</p>
              </div>
            </TabsContent>
            <TabsContent value="clinic" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Clinic Details</h2>
                <p>Your clinic information will be displayed here.</p>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
  
  // If renderLayout is false, just return the content without any wrapper
  if (!renderLayout) {
    return content;
  }
  
  // Otherwise, wrap it in a container (layout can be enhanced as needed)
  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      {content}
    </div>
  );
};

export default UniversalProfessionalProfile;

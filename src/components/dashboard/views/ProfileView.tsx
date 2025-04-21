
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRecoilValue } from "recoil";
import { 
  doctorStampUrlState, 
  doctorSignatureUrlState,
  pharmacistStampUrlState,
  pharmacistSignatureUrlState
} from "@/store/images/atoms";

// Import the components for each section
import PersonalDetails from "@/components/settings/PersonalDetails";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import NextOfKinManagement from "@/components/settings/NextOfKinManagement";
import ProfessionalStampSignature from "@/components/settings/profile/ProfessionalStampSignature";
import DoctorWorkplaceSelection from "@/components/doctor/DoctorWorkplaceSelection";
import { UserRole } from "@/types/role";

interface ProfileViewProps {
  activeTab: string;
  userRole: string | null;
}

const ProfileView: React.FC<ProfileViewProps> = ({ activeTab, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Use Recoil state for images
  const doctorStampUrl = useRecoilValue(doctorStampUrlState);
  const doctorSignatureUrl = useRecoilValue(doctorSignatureUrlState);
  const pharmacistStampUrl = useRecoilValue(pharmacistStampUrlState);
  const pharmacistSignatureUrl = useRecoilValue(pharmacistSignatureUrlState);

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("ProfileView: Tab changed to:", value);
    
    // Handle different URL patterns based on the location
    if (location.pathname === '/dashboard' && searchParams.get('view') === 'pharmacy') {
      // For pharmacist view within dashboard
      navigate(`/dashboard?view=pharmacy&section=profile&profileTab=${value}`);
    } else if (location.pathname === '/dashboard' && searchParams.get('view') === 'doctor') {
      // For doctor view within dashboard
      navigate(`/dashboard?view=doctor&section=profile&profileTab=${value}`);
    } else {
      // For regular dashboard profile view
      navigate(`/dashboard?view=profile&profileTab=${value}`);
    }
  };

  // Get role-specific tabs configuration
  const getTabs = () => {
    // Common tabs for all users
    const commonTabs = [
      { id: 'personal', label: 'Personal Info' },
      { id: 'addresses', label: 'Addresses' },
      { id: 'nextofkin', label: 'Next of Kin' }
    ];
    
    // Role-specific additional tabs
    switch (userRole) {
      case 'patient':
        return [
          ...commonTabs,
          { id: 'pharmacy', label: 'Default Pharmacy' },
          { id: 'doctor', label: 'My Doctor' }
        ];
      case 'doctor':
        return [
          ...commonTabs,
          { id: 'stamp', label: 'Stamp & Signature' },
          { id: 'workplace', label: 'Workplace' }
        ];
      case 'pharmacist':
        return [
          ...commonTabs,
          { id: 'stampSignature', label: 'Stamp & Signature' }
        ];
      case 'superadmin':
        return [
          ...commonTabs,
          { id: 'admin', label: 'Admin Settings' }
        ];
      default:
        return commonTabs;
    }
  };

  const tabs = getTabs();

  // Determine which tab should be active or use the first tab as default
  const currentActiveTab = activeTab || tabs[0].id;
  
  console.log("ProfileView: Current active tab:", currentActiveTab, "for role:", userRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your personal information should be kept up to date to ensure the best service experience.
        </p>
      </div>
      
      <Tabs defaultValue={currentActiveTab} value={currentActiveTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Personal Info Tab */}
        <TabsContent value="personal" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <PersonalDetails />
          </div>
        </TabsContent>
        
        {/* Addresses Tab */}
        <TabsContent value="addresses" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Addresses</h2>
            <AddressManagement />
          </div>
        </TabsContent>
        
        {/* Pharmacy Tab - Only for patients */}
        {userRole === 'patient' && (
          <TabsContent value="pharmacy" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Default Pharmacy</h2>
              <PharmacySelection />
            </div>
          </TabsContent>
        )}
        
        {/* Doctor Tab - Only for patients */}
        {userRole === 'patient' && (
          <TabsContent value="doctor" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">My Doctor</h2>
              <DoctorManagement />
            </div>
          </TabsContent>
        )}
        
        {/* Next of Kin Tab */}
        <TabsContent value="nextofkin" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Next of Kin</h2>
            <NextOfKinManagement />
          </div>
        </TabsContent>
        
        {/* Stamp & Signature Tab - Only for doctors */}
        {userRole === 'doctor' && (
          <TabsContent value="stamp" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Stamp & Signature</h2>
              <ProfessionalStampSignature 
                userRole={UserRole.Doctor}
                stampUrl={doctorStampUrl || profile?.doctor_stamp_url || null} 
                signatureUrl={doctorSignatureUrl || profile?.doctor_signature_url || null} 
              />
            </div>
          </TabsContent>
        )}
        
        {/* Workplace Tab - Only for doctors */}
        {userRole === 'doctor' && (
          <TabsContent value="workplace" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Workplace Selection</h2>
              <DoctorWorkplaceSelection />
            </div>
          </TabsContent>
        )}
        
        {/* Stamp & Signature Tab - Only for pharmacists */}
        {userRole === 'pharmacist' && (
          <TabsContent value="stampSignature" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Stamp & Signature</h2>
              <ProfessionalStampSignature 
                userRole={UserRole.Pharmacist}
                stampUrl={pharmacistStampUrl || profile?.pharmacist_stamp_url || null} 
                signatureUrl={pharmacistSignatureUrl || profile?.pharmacist_signature_url || null} 
              />
            </div>
          </TabsContent>
        )}
        
        {userRole === 'superadmin' && (
          <TabsContent value="admin" className="mt-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
              <p>Administrative settings will be displayed here.</p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProfileView;

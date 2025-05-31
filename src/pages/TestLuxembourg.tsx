import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  LocationDetectionTest,
  LuxTrustIdTest,
  LuxTrustAuthTest,
  CertificationTest,
  LoginButtonTest,
  Country,
  LuxTrustProfile,
  Certification,
  IdVerificationStatus
} from '@/components/test-luxembourg';
import { useLuxTrustAuth } from '@/hooks/useLuxTrustAuth';
import { useLuxTrustIdVerification } from '@/hooks/useLuxTrustIdVerification';

const TestLuxembourg: React.FC = () => {
  // Location Detection State
  const [currentCountry, setCurrentCountry] = useState('LU');
  const [isLuxembourg, setIsLuxembourg] = useState(true);
  
  // LuxTrust Auth using the new hook
  const { authenticateWithLuxTrust, isAuthenticating, isAuthenticated, authResponse } = useLuxTrustAuth();
  
  // Professional Certification State
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // LuxTrust ID Field using the new hook
  const [luxtrustId, setLuxtrustId] = useState('');
  const [isIdVisible, setIsIdVisible] = useState(false);
  const { verifyLuxTrustId, resetVerification, isVerifying, verificationStatus } = useLuxTrustIdVerification();

  const countries: Country[] = [
    { code: 'LU', name: 'Luxembourg' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'BE', name: 'Belgium' },
    { code: 'US', name: 'United States' }
  ];

  // Validate LuxTrust ID format
  const validateLuxTrustId = (id: string): boolean => {
    const patterns = [
      /^LUX-\d{4}-\d{6}$/,
      /^LT-[A-Z]{3}-\d{6}$/,
      /^LUXTRUST-\d{6}$/,
      /^TEST-LUX-ID-\d{6}$/
    ];
    
    return patterns.some(pattern => pattern.test(id));
  };

  // Location detection with direct API call
  const handleCountryChange = async (countryCode: string) => {
    setCurrentCountry(countryCode);
    setIsLuxembourg(countryCode === 'LU');

    try {
      const API_BASE_URL = import.meta.env.DEV 
        ? 'http://localhost:54327'
        : 'https://hrrlefgnhkbzuwyklejj.supabase.co/functions/v1';

      const response = await fetch(`${API_BASE_URL}/auth-service/location/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ countryCode })
      });

      if (!response.ok) {
        console.error('Location detection error: HTTP', response.status);
      } else {
        const data = await response.json();
        console.log('Location detection result stored in KV:', data);
      }
    } catch (error) {
      console.error('Location detection failed:', error);
    }

    toast({
      title: 'Location Updated',
      description: `Country set to ${countries.find(c => c.code === countryCode)?.name}. LuxTrust ${countryCode === 'LU' ? 'enabled' : 'disabled'}.`
    });
  };

  // Convert LuxTrust profile from auth response
  const luxtrustProfile: LuxTrustProfile | null = authResponse?.profile ? {
    id: authResponse.profile.id,
    firstName: authResponse.profile.firstName,
    lastName: authResponse.profile.lastName,
    professionalId: authResponse.profile.professionalId || '',
    certificationLevel: authResponse.profile.certificationLevel,
    isVerified: authResponse.profile.isVerified
  } : null;

  const handleCertificationUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      fileName: selectedFile.name,
      type: 'doctor',
      status: 'pending',
      uploadedAt: new Date().toISOString()
    };
    
    setCertifications(prev => [newCert, ...prev]);
    setSelectedFile(null);
    setIsUploading(false);
    
    toast({
      title: 'Certification Uploaded',
      description: 'File uploaded successfully and is pending verification.'
    });
  };

  const handleCertificationVerification = async (certId: string) => {
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCertifications(prev => 
      prev.map(cert => 
        cert.id === certId 
          ? { ...cert, status: 'verified' as const, verifiedAt: new Date().toISOString() }
          : cert
      )
    );
    
    toast({
      title: 'Certification Verified',
      description: `LuxTrust has verified your professional certification! Verification ID: VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    });
  };

  const handleLuxTrustIdVerification = () => {
    verifyLuxTrustId(luxtrustId);
  };

  const resetLuxTrustIdVerification = () => {
    resetVerification();
    setLuxtrustId('');
  };

  const fillTestId = () => {
    setLuxtrustId('TEST-LUX-ID-123456');
  };

  const resetAllTests = () => {
    setCurrentCountry('LU');
    setIsLuxembourg(true);
    setCertifications([]);
    setLuxtrustId('');
    resetVerification();
    setSelectedFile(null);
    
    toast({
      title: 'Tests Reset',
      description: 'All test states have been reset.'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Luxembourg/LuxTrust Testing Suite
          </h1>
          <p className="text-gray-600">
            Interactive testing for LuxTrust authentication, location detection, and professional certification features
          </p>
          <Button onClick={resetAllTests} variant="outline" className="mt-4">
            Reset All Tests
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LocationDetectionTest
            currentCountry={currentCountry}
            isLuxembourg={isLuxembourg}
            countries={countries}
            onCountryChange={handleCountryChange}
          />

          <LuxTrustIdTest
            luxtrustId={luxtrustId}
            isIdVisible={isIdVisible}
            idVerificationStatus={verificationStatus}
            isVerifying={isVerifying}
            onIdChange={setLuxtrustId}
            onToggleVisibility={() => setIsIdVisible(!isIdVisible)}
            onVerify={handleLuxTrustIdVerification}
            onReset={resetLuxTrustIdVerification}
            onFillTestId={fillTestId}
          />

          <LuxTrustAuthTest
            isLuxembourg={isLuxembourg}
            isAuthenticating={isAuthenticating}
            isAuthenticated={isAuthenticated}
            luxtrustProfile={luxtrustProfile}
            onAuthenticate={authenticateWithLuxTrust}
          />

          <CertificationTest
            certifications={certifications}
            selectedFile={selectedFile}
            isUploading={isUploading}
            onFileSelect={setSelectedFile}
            onUpload={handleCertificationUpload}
            onVerify={handleCertificationVerification}
          />

          <LoginButtonTest
            isLuxembourg={isLuxembourg}
            currentCountry={currentCountry}
            countries={countries}
          />
        </div>
      </div>
    </div>
  );
};

export default TestLuxembourg;

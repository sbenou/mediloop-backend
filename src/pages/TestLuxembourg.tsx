
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

const TestLuxembourg: React.FC = () => {
  // Location Detection State
  const [currentCountry, setCurrentCountry] = useState('LU');
  const [isLuxembourg, setIsLuxembourg] = useState(true);
  
  // LuxTrust Auth State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [luxtrustProfile, setLuxtrustProfile] = useState<LuxTrustProfile | null>(null);
  
  // Professional Certification State
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // LuxTrust ID Field State
  const [luxtrustId, setLuxtrustId] = useState('');
  const [isIdVisible, setIsIdVisible] = useState(false);
  const [idVerificationStatus, setIdVerificationStatus] = useState<IdVerificationStatus>('unverified');
  const [isVerifying, setIsVerifying] = useState(false);

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

  // Handlers
  const handleCountryChange = (countryCode: string) => {
    setCurrentCountry(countryCode);
    setIsLuxembourg(countryCode === 'LU');
  };

  const handleLuxTrustAuth = async () => {
    setIsAuthenticating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockProfile: LuxTrustProfile = {
      id: `lux-${Date.now()}`,
      firstName: 'Dr. Jean',
      lastName: 'Luxembourg',
      professionalId: 'LUX-DOC-2024-001',
      certificationLevel: 'professional',
      isVerified: true
    };
    
    setLuxtrustProfile(mockProfile);
    setIsAuthenticated(true);
    setIsAuthenticating(false);
  };

  const handleCertificationUpload = async () => {
    setIsUploading(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      fileName: selectedFile!.name,
      type: 'doctor',
      status: 'pending',
      uploadedAt: new Date().toISOString()
    };
    
    setCertifications(prev => [newCert, ...prev]);
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleCertificationVerification = async (certId: string) => {
    setCertifications(prev => 
      prev.map(cert => 
        cert.id === certId 
          ? { ...cert, status: 'verified' as const, verifiedAt: new Date().toISOString() }
          : cert
      )
    );
  };

  const verifyLuxTrustId = async () => {
    if (!luxtrustId.trim()) {
      toast({
        title: 'LuxTrust ID Required',
        description: 'Please enter a LuxTrust ID first.',
        variant: 'destructive'
      });
      return;
    }

    if (!validateLuxTrustId(luxtrustId)) {
      setIdVerificationStatus('failed');
      toast({
        title: 'Invalid LuxTrust ID Format',
        description: 'Please check the format and try again.',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    setIdVerificationStatus('verifying');

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock verification - 90% success rate for demo
    const isVerificationSuccessful = Math.random() > 0.1;

    if (isVerificationSuccessful) {
      setIdVerificationStatus('verified');
      toast({
        title: 'LuxTrust ID Verified',
        description: 'Your LuxTrust ID has been successfully verified and linked to your account.',
      });
    } else {
      setIdVerificationStatus('failed');
      toast({
        title: 'Verification Failed',
        description: 'Could not verify this LuxTrust ID. Please check and try again.',
        variant: 'destructive'
      });
    }

    setIsVerifying(false);
  };

  const resetVerification = () => {
    setIdVerificationStatus('unverified');
    setLuxtrustId('');
  };

  const fillTestId = () => {
    setLuxtrustId('TEST-LUX-ID-123456');
  };

  const resetAllTests = () => {
    setCurrentCountry('LU');
    setIsLuxembourg(true);
    setIsAuthenticated(false);
    setLuxtrustProfile(null);
    setCertifications([]);
    setLuxtrustId('');
    setIdVerificationStatus('unverified');
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
            idVerificationStatus={idVerificationStatus}
            isVerifying={isVerifying}
            onIdChange={setLuxtrustId}
            onToggleVisibility={() => setIsIdVisible(!isIdVisible)}
            onVerify={verifyLuxTrustId}
            onReset={resetVerification}
            onFillTestId={fillTestId}
          />

          <LuxTrustAuthTest
            isLuxembourg={isLuxembourg}
            isAuthenticating={isAuthenticating}
            isAuthenticated={isAuthenticated}
            luxtrustProfile={luxtrustProfile}
            onAuthenticate={handleLuxTrustAuth}
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

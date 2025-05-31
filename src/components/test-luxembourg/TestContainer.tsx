
import React from 'react';
import {
  LocationDetectionTest,
  LuxTrustIdTest,
  LuxTrustAuthTest,
  CertificationTest,
  LoginButtonTest,
} from '@/components/test-luxembourg';
import type { TestContainerProps } from './types';

export const TestContainer: React.FC<TestContainerProps> = ({
  // Location Detection
  currentCountry,
  isLuxembourg,
  countries,
  onCountryChange,
  
  // LuxTrust Auth
  isAuthenticating,
  isAuthenticated,
  luxtrustProfile,
  onAuthenticate,
  
  // Professional Certification
  certifications,
  selectedFile,
  isUploading,
  onFileSelect,
  onUpload,
  onVerify,
  
  // LuxTrust ID Field
  luxtrustId,
  isIdVisible,
  idVerificationStatus,
  isVerifying,
  onIdChange,
  onToggleVisibility,
  onVerifyId,
  onResetVerification,
  onFillTestId,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LocationDetectionTest
        currentCountry={currentCountry}
        isLuxembourg={isLuxembourg}
        countries={countries}
        onCountryChange={onCountryChange}
      />

      <LuxTrustIdTest
        luxtrustId={luxtrustId}
        isIdVisible={isIdVisible}
        idVerificationStatus={idVerificationStatus}
        isVerifying={isVerifying}
        onIdChange={onIdChange}
        onToggleVisibility={onToggleVisibility}
        onVerify={onVerifyId}
        onReset={onResetVerification}
        onFillTestId={onFillTestId}
      />

      <LuxTrustAuthTest
        isLuxembourg={isLuxembourg}
        isAuthenticating={isAuthenticating}
        isAuthenticated={isAuthenticated}
        luxtrustProfile={luxtrustProfile}
        onAuthenticate={onAuthenticate}
      />

      <CertificationTest
        certifications={certifications}
        selectedFile={selectedFile}
        isUploading={isUploading}
        onFileSelect={onFileSelect}
        onUpload={onUpload}
        onVerify={onVerify}
      />

      <LoginButtonTest
        isLuxembourg={isLuxembourg}
        currentCountry={currentCountry}
        countries={countries}
      />
    </div>
  );
};

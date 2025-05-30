
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileCheck, Clock } from 'lucide-react';
import LuxTrustAuthButton from './LuxTrustAuthButton';
import ProfessionalCertificationUpload from './ProfessionalCertificationUpload';
import { useLuxTrustAuth } from '@/hooks/useLuxTrustAuth';

interface LuxembourgProfessionalStampSignatureProps {
  userRole: 'doctor' | 'pharmacist';
}

const LuxembourgProfessionalStampSignature: React.FC<LuxembourgProfessionalStampSignatureProps> = ({ 
  userRole 
}) => {
  const { isAuthenticated, authResponse } = useLuxTrustAuth();
  const rolePrefix = userRole === 'doctor' ? "Doctor" : "Pharmacist";

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
        <h3 className="font-semibold text-blue-900">Luxembourg Professional Services</h3>
        <p className="text-sm text-blue-700">
          As a Luxembourg user, you can use LuxTrust for professional authentication and digital signatures.
        </p>
      </div>

      {/* LuxTrust Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            LuxTrust Professional Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated && authResponse ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  ✓ LuxTrust Verified
                </Badge>
                <Badge variant="outline">
                  Level: {authResponse.profile?.certificationLevel}
                </Badge>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Professional ID:</strong> {authResponse.profile?.professionalId}
                </p>
                <p className="text-sm text-green-600">
                  Verified: {new Date(authResponse.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-green-600">
                  Verification ID: {authResponse.verificationId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Digital Stamp</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    LuxTrust-verified professional stamp available for documents
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Digital Signature</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Legally binding electronic signature via LuxTrust
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">LuxTrust authentication required</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Authenticate with LuxTrust to enable professional digital signatures and stamps for your {rolePrefix.toLowerCase()} practice.
              </p>
              <LuxTrustAuthButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Certification Management */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessionalCertificationUpload />
        </CardContent>
      </Card>

      {/* Features Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Professional Document Signing</span>
              <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                {isAuthenticated ? 'Enabled' : 'Requires LuxTrust'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Certified {rolePrefix} Stamp</span>
              <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                {isAuthenticated ? 'Available' : 'Requires LuxTrust'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Legal Document Validation</span>
              <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                {isAuthenticated ? 'Active' : 'Pending'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LuxembourgProfessionalStampSignature;

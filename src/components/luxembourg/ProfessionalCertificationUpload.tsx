import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useProfessionalCertification } from '@/hooks/useProfessionalCertification';
import LuxTrustAuthButton from './LuxTrustAuthButton';

const ProfessionalCertificationUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [certificationType, setCertificationType] = useState<'doctor' | 'pharmacist' | 'nurse' | 'other'>('doctor');
  
  const { 
    certifications, 
    isLoading, 
    isUploading, 
    isVerifying,
    uploadCertification, 
    verifyCertification 
  } = useProfessionalCertification();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    await uploadCertification(selectedFile, certificationType);
    setSelectedFile(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload New Certification */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Professional Certification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="certification-type">Certification Type</Label>
            <Select value={certificationType} onValueChange={(value: any) => setCertificationType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select certification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="other">Other Healthcare Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="certification-file">Certification Document</Label>
            <Input
              id="certification-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Accepted formats: PDF, JPG, PNG (max 10MB)
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Certification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Your Professional Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          {certifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No certifications uploaded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(cert.verificationStatus)}
                      <div>
                        <p className="font-medium capitalize">{cert.certificationType}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(cert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(cert.verificationStatus)}>
                        {cert.verificationStatus}
                      </Badge>
                      {cert.verificationStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => verifyCertification(cert.id)}
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            'Verify with LuxTrust'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {cert.verificationStatus === 'verified' && cert.luxtrustVerificationId && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                      <p className="text-green-800">
                        ✓ Verified by LuxTrust (ID: {cert.luxtrustVerificationId})
                      </p>
                      {cert.expiresAt && (
                        <p className="text-green-600">
                          Valid until: {new Date(cert.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LuxTrust Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>LuxTrust Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Authenticate with LuxTrust to verify your professional status and enable advanced features.
          </p>
          <LuxTrustAuthButton />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalCertificationUpload;

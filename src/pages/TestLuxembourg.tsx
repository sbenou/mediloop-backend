
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, MapPin, Upload, FileCheck, Globe, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const TestLuxembourg: React.FC = () => {
  // Location Detection State
  const [currentCountry, setCurrentCountry] = useState('LU');
  const [isLuxembourg, setIsLuxembourg] = useState(true);
  
  // LuxTrust Auth State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [luxtrustProfile, setLuxtrustProfile] = useState<any>(null);
  
  // Professional Certification State
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // LuxTrust ID Field State
  const [luxtrustId, setLuxtrustId] = useState('');
  const [isIdVisible, setIsIdVisible] = useState(false);
  const [idVerificationStatus, setIdVerificationStatus] = useState<'unverified' | 'verifying' | 'verified' | 'failed'>('unverified');
  const [isVerifying, setIsVerifying] = useState(false);

  const countries = [
    { code: 'LU', name: 'Luxembourg' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'BE', name: 'Belgium' },
    { code: 'US', name: 'United States' }
  ];

  // Validate LuxTrust ID format
  const validateLuxTrustId = (id: string): boolean => {
    // Mock validation - in production this would check proper LuxTrust format
    const patterns = [
      /^LUX-\d{4}-\d{6}$/,
      /^LT-[A-Z]{3}-\d{6}$/,
      /^LUXTRUST-\d{6}$/,
      /^TEST-LUX-ID-\d{6}$/
    ];
    
    return patterns.some(pattern => pattern.test(id));
  };

  // Test Functions
  const testLocationDetection = (countryCode: string) => {
    setCurrentCountry(countryCode);
    setIsLuxembourg(countryCode === 'LU');
    
    toast({
      title: 'Location Updated',
      description: `Country set to ${countries.find(c => c.code === countryCode)?.name}. LuxTrust ${countryCode === 'LU' ? 'enabled' : 'disabled'}.`
    });
  };

  const testLuxTrustAuth = async () => {
    setIsAuthenticating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockProfile = {
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
    
    toast({
      title: 'LuxTrust Authentication Successful',
      description: 'Professional credentials verified successfully!'
    });
  };

  const testCertificationUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file first.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newCert = {
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

  const testCertificationVerification = async (certId: string) => {
    setCertifications(prev => 
      prev.map(cert => 
        cert.id === certId 
          ? { ...cert, status: 'verified', verifiedAt: new Date().toISOString() }
          : cert
      )
    );
    
    toast({
      title: 'Certification Verified',
      description: 'LuxTrust has verified your professional certification!'
    });
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

  const getVerificationStatusColor = () => {
    switch (idVerificationStatus) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'verifying': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusIcon = () => {
    switch (idVerificationStatus) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'verifying': return <Loader className="h-4 w-4 animate-spin" />;
      default: return null;
    }
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
          {/* Location Detection Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Location Detection Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Country to Test</Label>
                <Select value={currentCountry} onValueChange={testLocationDetection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Current Country:</strong> {countries.find(c => c.code === currentCountry)?.name}
                </p>
                <p className="text-sm">
                  <strong>Is Luxembourg:</strong> {isLuxembourg ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm">
                  <strong>LuxTrust Available:</strong> {isLuxembourg ? '✅ Available' : '❌ Not Available'}
                </p>
              </div>

              {isLuxembourg && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <Badge className="bg-green-100 text-green-800 mb-2">Luxembourg User</Badge>
                  <p className="text-sm text-green-800">
                    LuxTrust authentication and Luxembourg-specific features are available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LuxTrust ID Field Test */}
          <Card>
            <CardHeader>
              <CardTitle>LuxTrust ID Field Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-luxtrust-id">LuxTrust ID</Label>
                <div className="relative">
                  <Input
                    id="test-luxtrust-id"
                    type={isIdVisible ? 'text' : 'password'}
                    value={luxtrustId}
                    onChange={(e) => setLuxtrustId(e.target.value)}
                    placeholder="Enter test LuxTrust ID"
                    className="pr-10"
                    disabled={idVerificationStatus === 'verified'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setIsIdVisible(!isIdVisible)}
                  >
                    {isIdVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Valid formats: LUX-YYYY-XXXXXX, LT-XXX-XXXXXX, LUXTRUST-XXXXXX
                </p>
              </div>

              {/* Verification Status */}
              <div className="flex items-center space-x-2">
                <Badge className={getVerificationStatusColor()}>
                  <div className="flex items-center space-x-1">
                    {getVerificationStatusIcon()}
                    <span className="capitalize">{idVerificationStatus}</span>
                  </div>
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={() => setLuxtrustId('TEST-LUX-ID-123456')}
                  variant="outline"
                  className="w-full"
                  disabled={idVerificationStatus === 'verified'}
                >
                  Fill Test ID
                </Button>

                {idVerificationStatus === 'unverified' || idVerificationStatus === 'failed' ? (
                  <Button 
                    onClick={verifyLuxTrustId}
                    disabled={isVerifying || !luxtrustId.trim()}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Verifying with LuxTrust...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Verify LuxTrust ID
                      </>
                    )}
                  </Button>
                ) : idVerificationStatus === 'verified' ? (
                  <Button 
                    onClick={resetVerification}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Verification
                  </Button>
                ) : null}
              </div>

              {/* Verification Details */}
              {idVerificationStatus === 'verified' && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Status:</strong> ✅ Verified and linked to account
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>ID:</strong> {luxtrustId}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Verified:</strong> {new Date().toLocaleString()}
                  </p>
                </div>
              )}

              {idVerificationStatus === 'failed' && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Verification failed.</strong> Common issues:
                  </p>
                  <ul className="text-sm text-red-800 list-disc list-inside mt-1">
                    <li>Invalid ID format</li>
                    <li>ID not found in LuxTrust database</li>
                    <li>ID already linked to another account</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LuxTrust Authentication Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                LuxTrust Authentication Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <Button
                  onClick={testLuxTrustAuth}
                  disabled={isAuthenticating || !isLuxembourg}
                  className="w-full"
                >
                  {isAuthenticating ? (
                    <>Authenticating with LuxTrust...</>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Authenticate with LuxTrust
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button variant="outline" disabled className="w-full">
                    <FileCheck className="mr-2 h-4 w-4 text-green-600" />
                    LuxTrust Verified
                  </Button>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Name:</strong> {luxtrustProfile?.firstName} {luxtrustProfile?.lastName}
                    </p>
                    <p className="text-sm text-green-800">
                      <strong>Professional ID:</strong> {luxtrustProfile?.professionalId}
                    </p>
                    <p className="text-sm text-green-800">
                      <strong>Level:</strong> {luxtrustProfile?.certificationLevel}
                    </p>
                  </div>
                </div>
              )}

              {!isLuxembourg && (
                <p className="text-sm text-muted-foreground text-center">
                  LuxTrust authentication is only available for Luxembourg users
                </p>
              )}
            </CardContent>
          </Card>

          {/* Professional Certification Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Professional Certification Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cert-file">Upload Test Certificate</Label>
                <Input
                  id="cert-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                />
              </div>

              <Button
                onClick={testCertificationUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>Uploading Certification...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Test Certification
                  </>
                )}
              </Button>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Test Certifications</h4>
                {certifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No test certifications uploaded yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {certifications.map(cert => (
                      <div key={cert.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{cert.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {cert.type} • {new Date(cert.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={cert.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            >
                              {cert.status}
                            </Badge>
                            {cert.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => testCertificationVerification(cert.id)}
                              >
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Login Button Visibility Test */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Login Button Visibility Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This section simulates how the login page would appear based on the user's location:
                </p>
                
                {/* Simulated Login Form */}
                <div className="max-w-md mx-auto p-6 border rounded-lg bg-white">
                  <h3 className="text-lg font-semibold mb-4">Login (Simulated)</h3>
                  
                  {/* Regular login fields */}
                  <div className="space-y-3 mb-4">
                    <Input placeholder="Email" disabled />
                    <Input type="password" placeholder="Password" disabled />
                    <Button disabled className="w-full">Sign In</Button>
                  </div>
                  
                  {/* OR separator */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  {/* OAuth buttons */}
                  <div className="space-y-2">
                    {/* Google button - always visible */}
                    <Button variant="outline" className="w-full" disabled>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </Button>
                    
                    {/* LuxTrust button - only for Luxembourg */}
                    {isLuxembourg && (
                      <Button variant="outline" className="w-full" disabled>
                        <div className="mr-2 h-4 w-4 rounded bg-red-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">LT</span>
                        </div>
                        Continue with LuxTrust
                      </Button>
                    )}
                    
                    {/* Future: FranceConnect button - only for France */}
                    {currentCountry === 'FR' && (
                      <Button variant="outline" className="w-full" disabled>
                        <div className="mr-2 h-4 w-4 rounded bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">FC</span>
                        </div>
                        Continue with FranceConnect
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Change the country above to see different OAuth options appear
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestLuxembourg;

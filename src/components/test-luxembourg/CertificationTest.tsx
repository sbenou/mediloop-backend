
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Certification } from './types';

interface CertificationTestProps {
  certifications: Certification[];
  selectedFile: File | null;
  isUploading: boolean;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onVerify: (certId: string) => void;
}

export const CertificationTest: React.FC<CertificationTestProps> = ({
  certifications,
  selectedFile,
  isUploading,
  onFileSelect,
  onUpload,
  onVerify
}) => {
  const testCertificationUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file first.',
        variant: 'destructive'
      });
      return;
    }

    onUpload();
    
    toast({
      title: 'Certification Uploaded',
      description: 'File uploaded successfully and is pending verification.'
    });
  };

  const testCertificationVerification = async (certId: string) => {
    onVerify(certId);
    
    toast({
      title: 'Certification Verified',
      description: 'LuxTrust has verified your professional certification!'
    });
  };

  return (
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
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
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
  );
};


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { IdVerificationStatus } from './types';

interface LuxTrustIdTestProps {
  luxtrustId: string;
  isIdVisible: boolean;
  idVerificationStatus: IdVerificationStatus;
  isVerifying: boolean;
  onIdChange: (id: string) => void;
  onToggleVisibility: () => void;
  onVerify: () => void;
  onReset: () => void;
  onFillTestId: () => void;
}

export const LuxTrustIdTest: React.FC<LuxTrustIdTestProps> = ({
  luxtrustId,
  isIdVisible,
  idVerificationStatus,
  isVerifying,
  onIdChange,
  onToggleVisibility,
  onVerify,
  onReset,
  onFillTestId
}) => {
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
              onChange={(e) => onIdChange(e.target.value)}
              placeholder="Enter test LuxTrust ID"
              className="pr-10"
              disabled={idVerificationStatus === 'verified'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={onToggleVisibility}
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
            onClick={onFillTestId}
            variant="outline"
            className="w-full"
            disabled={idVerificationStatus === 'verified'}
          >
            Fill Test ID
          </Button>

          {idVerificationStatus === 'unverified' || idVerificationStatus === 'failed' ? (
            <Button 
              onClick={onVerify}
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
              onClick={onReset}
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
  );
};

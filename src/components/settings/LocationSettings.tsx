
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe } from 'lucide-react';
import { useLocationDetection } from '@/hooks/useLocationDetection';

const COUNTRIES = [
  { code: 'LU', name: 'Luxembourg' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
];

const LocationSettings: React.FC = () => {
  const { locationPreference, isLoading, updateCountryPreference } = useLocationDetection();

  const handleCountryChange = (countryCode: string) => {
    updateCountryPreference(countryCode);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Country Preference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="country-select">Your Country</Label>
            <Select 
              value={locationPreference.country} 
              onValueChange={handleCountryChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              This affects available features and services in your region.
            </p>
          </div>

          {locationPreference.detectedFromAddress && (
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Country detected from your address
              </span>
            </div>
          )}

          {locationPreference.isLuxembourg && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className="bg-green-100 text-green-800">Luxembourg User</Badge>
              </div>
              <p className="text-sm text-green-800">
                You have access to LuxTrust authentication and Luxembourg-specific features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">LuxTrust Authentication</span>
              <Badge variant={locationPreference.isLuxembourg ? 'default' : 'secondary'}>
                {locationPreference.isLuxembourg ? 'Available' : 'Not Available'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Professional Certification Verification</span>
              <Badge variant={locationPreference.isLuxembourg ? 'default' : 'secondary'}>
                {locationPreference.isLuxembourg ? 'LuxTrust' : 'Standard'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Regional Pharmacy Network</span>
              <Badge variant="default">Available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSettings;

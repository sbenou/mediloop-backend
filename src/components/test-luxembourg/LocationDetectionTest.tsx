
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Country } from './types';

interface LocationDetectionTestProps {
  currentCountry: string;
  isLuxembourg: boolean;
  countries: Country[];
  onCountryChange: (countryCode: string) => void;
}

export const LocationDetectionTest: React.FC<LocationDetectionTestProps> = ({
  currentCountry,
  isLuxembourg,
  countries,
  onCountryChange
}) => {
  const testLocationDetection = (countryCode: string) => {
    onCountryChange(countryCode);
    
    toast({
      title: 'Location Updated',
      description: `Country set to ${countries.find(c => c.code === countryCode)?.name}. LuxTrust ${countryCode === 'LU' ? 'enabled' : 'disabled'}.`
    });
  };

  return (
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
  );
};

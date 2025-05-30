
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';
import { Country } from './types';

interface LoginButtonTestProps {
  isLuxembourg: boolean;
  currentCountry: string;
  countries: Country[];
}

export const LoginButtonTest: React.FC<LoginButtonTestProps> = ({
  isLuxembourg,
  currentCountry,
  countries
}) => {
  return (
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
  );
};

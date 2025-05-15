
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { Skeleton } from '@/components/ui/skeleton';

interface PharmacyFinderListProps {
  pharmacies: Pharmacy[];
  isLoading: boolean;
  userLocation: { lat: number; lon: number } | null;
}

export const PharmacyFinderList: React.FC<PharmacyFinderListProps> = ({ 
  pharmacies, 
  isLoading,
  userLocation
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-28" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="text-center p-12 bg-muted/30 rounded-lg border border-dashed">
        <h3 className="text-lg font-medium mb-2">No pharmacies found</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search criteria or location filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pharmacies.map((pharmacy) => (
        <Card key={pharmacy.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{pharmacy.name}</CardTitle>
            {pharmacy.distance && (
              <CardDescription>
                <Badge variant="outline" className="font-normal">
                  {pharmacy.distance}km away
                </Badge>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>{pharmacy.address || 'Address not available'}</span>
              </div>
              
              {pharmacy.hours && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{pharmacy.hours}</span>
                </div>
              )}
              
              {pharmacy.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{pharmacy.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Get Directions</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};


import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useAuth } from '@/hooks/auth/useAuth';
import { getMapboxToken } from '@/services/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-css';
import { MapPin, RefreshCw, Map } from 'lucide-react';

// Check if this is a mobile device
const isMobile = typeof window !== 'undefined' ? 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 
  false;

// Main page component
const SearchPharmacyTest = () => {
  const [searchQuery, setSearchQuery] = useState('Luxembourg');
  const [showDefaultLocation, setShowDefaultLocation] = useState(false);
  const [filteredPharmacies, setFilteredPharmacies] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  
  const { coordinates: locationCoordinates, handleCitySearch } = useLocationSearch();
  const { profile } = useAuth();
  
  // Default coordinates for Luxembourg
  const defaultCoordinates = { lat: 49.8153, lon: 6.1296 };
  
  // Get current coordinates
  const { data: coordinates } = useQuery({
    queryKey: ['geo-coordinates'],
    queryFn: async () => {
      return locationCoordinates ? 
        { lat: parseFloat(locationCoordinates.lat), lon: parseFloat(locationCoordinates.lon) } : 
        defaultCoordinates;
    },
    enabled: true,
  });
  
  const currentCoordinates = coordinates || defaultCoordinates;
  
  // Fetch pharmacies
  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('pharmacies')
          .select('*');
          
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching pharmacies:', err);
        return [];
      }
    }
  });
  
  // Initialize with default search
  useEffect(() => {
    if (!locationCoordinates) {
      handleCitySearch("Luxembourg");
    }
  }, []);
  
  // Update filtered pharmacies when all pharmacies load
  useEffect(() => {
    if (pharmacies && pharmacies.length > 0) {
      setFilteredPharmacies(pharmacies);
    }
  }, [pharmacies]);
  
  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const initMap = async () => {
      try {
        // Get Mapbox token
        const token = await getMapboxToken();
        if (!token) {
          setMapError('Failed to load Mapbox token');
          return;
        }
        
        mapboxgl.accessToken = token;
        
        // Create map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [currentCoordinates.lon, currentCoordinates.lat],
          zoom: 12
        });
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Handle map load
        map.current.on('load', () => {
          setIsMapLoaded(true);
          updateMarkers();
        });
        
        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Map error:', e);
          setMapError('Failed to load map');
        });
        
      } catch (error) {
        console.error('Error initializing Mapbox:', error);
        setMapError('Failed to initialize map');
      }
    };
    
    initMap();
    
    // Clean up
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentCoordinates]);
  
  // Update markers when map is loaded and data changes
  const updateMarkers = useCallback(() => {
    if (!map.current || !isMapLoaded || !pharmacies) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }
    
    // Add user location marker if available and using location
    if (showDefaultLocation && currentCoordinates) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '2px solid white';
      
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([currentCoordinates.lon, currentCoordinates.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your location'))
        .addTo(map.current);
    }
    
    // Add pharmacy markers
    filteredPharmacies.forEach((pharmacy) => {
      if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return;
      
      try {
        const pharmLat = parseFloat(pharmacy.coordinates.lat);
        const pharmLon = parseFloat(pharmacy.coordinates.lon);
        
        if (isNaN(pharmLat) || isNaN(pharmLon)) return;
        
        const popupContent = document.createElement('div');
        popupContent.className = 'text-sm p-2';
        popupContent.innerHTML = `
          <div class="font-semibold">${pharmacy.name || 'Unnamed Pharmacy'}</div>
          <p>${pharmacy.address || 'Address not available'}</p>
          ${pharmacy.distance ? `<p class="text-xs font-medium mt-1">Distance: ${pharmacy.distance} km</p>` : ''}
        `;
        
        const marker = new mapboxgl.Marker()
          .setLngLat([pharmLon, pharmLat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent))
          .addTo(map.current!);
        
        markers.current.push(marker);
      } catch (error) {
        console.error('Error adding pharmacy marker:', error);
      }
    });
  }, [currentCoordinates, filteredPharmacies, isMapLoaded, showDefaultLocation]);
  
  // Update markers when filtered pharmacies change
  useEffect(() => {
    updateMarkers();
  }, [filteredPharmacies, updateMarkers]);
  
  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    handleCitySearch(searchQuery);
    toast({
      title: "Searching",
      description: `Looking for pharmacies near ${searchQuery}`,
    });
  };
  
  // Handle "Set as Default" for pharmacy
  const handleSetDefault = async (pharmacyId: string) => {
    if (!profile?.id) {
      toast({
        title: "Login Required",
        description: "Please login to set a default pharmacy",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Using a type assertion to bypass TypeScript check
      // since we know pharmacy_id exists in the database
      const { error } = await supabase.from('profiles')
        .update({ 
          pharmacy_id: pharmacyId 
        } as any)  // Type assertion to bypass TypeScript check
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Default Pharmacy Set",
        description: "Your default pharmacy has been updated"
      });
    } catch (err) {
      console.error('Error setting default pharmacy:', err);
      toast({
        title: "Error",
        description: "Failed to set default pharmacy",
        variant: "destructive"
      });
    }
  };
  
  // Toggle location usage
  const handleLocationToggle = (checked: boolean) => {
    setShowDefaultLocation(checked);
    
    // Filter pharmacies based on location
    if (checked && currentCoordinates && pharmacies) {
      const nearbyPharmacies = pharmacies.filter(pharmacy => {
        if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
        
        try {
          const pharmLat = parseFloat(pharmacy.coordinates.lat);
          const pharmLon = parseFloat(pharmacy.coordinates.lon);
          
          if (isNaN(pharmLat) || isNaN(pharmLon)) return false;
          
          // Calculate distance using the Haversine formula
          const R = 6371; // Earth radius in km
          const dLat = (pharmLat - currentCoordinates.lat) * Math.PI / 180;
          const dLon = (pharmLon - currentCoordinates.lon) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(currentCoordinates.lat * Math.PI / 180) * Math.cos(pharmLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          // Add distance to pharmacy for display
          pharmacy.distance = distance.toFixed(1);
          
          return distance <= 2; // 2km radius
        } catch (error) {
          console.error('Error calculating distance for pharmacy:', error);
          return false;
        }
      });
      
      setFilteredPharmacies(nearbyPharmacies);
      
      // Fly to user location
      if (map.current && currentCoordinates) {
        map.current.flyTo({
          center: [currentCoordinates.lon, currentCoordinates.lat],
          zoom: 13,
          essential: true
        });
      }
    } else {
      // Show all pharmacies when location filtering is disabled
      setFilteredPharmacies(pharmacies || []);
    }
  };
  
  // Handle retry button click
  const handleRetry = () => {
    setMapError(null);
    
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Force component re-render
    setIsMapLoaded(false);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Find a Pharmacy</h1>
          <div className="flex gap-2 max-w-xl">
            <Input
              placeholder="Enter city or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[350px,1fr] gap-6">
          {/* Pharmacy list */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="location-toggle"
                checked={showDefaultLocation}
                onCheckedChange={handleLocationToggle}
              />
              <Label htmlFor="location-toggle">
                Use my location
              </Label>
            </div>
            
            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {isLoading ? (
                <p>Loading pharmacies...</p>
              ) : filteredPharmacies.length === 0 ? (
                <p>No pharmacies found</p>
              ) : (
                filteredPharmacies.map((pharmacy) => (
                  <Card key={pharmacy.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
                        <p className="text-sm text-gray-500">{pharmacy.address}</p>
                        {pharmacy.phone && (
                          <p className="text-sm">📞 {pharmacy.phone}</p>
                        )}
                        {pharmacy.email && (
                          <p className="text-sm">✉️ {pharmacy.email}</p>
                        )}
                        {pharmacy.hours && (
                          <p className="text-sm">⏰ {pharmacy.hours}</p>
                        )}
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetDefault(pharmacy.id)}
                          >
                            Set as Default
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
          
          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-gray-200 h-[calc(100vh-250px)]">
            {mapError ? (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
                <MapPin className="h-10 w-10 text-red-400 mb-2" />
                <h3 className="text-lg font-medium mb-2">Map Error</h3>
                <p className="text-sm text-gray-600 mb-4">{mapError}</p>
                <Button onClick={handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Loading Map
                </Button>
              </div>
            ) : (
              <div ref={mapContainer} className="w-full h-full" />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPharmacyTest;

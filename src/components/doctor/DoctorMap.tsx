
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Search, Map, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Doctor {
  id: string;
  full_name: string;
  coordinates?: { lat: number; lon: number } | null;
  distance?: number;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  source?: 'database' | 'overpass';
}

interface DoctorMapProps {
  doctors: Doctor[];
  userCoordinates: { lat: number; lon: number } | null;
  showUserLocation?: boolean;
  onDoctorSelect: (doctorId: string) => void;
}

const DoctorMap = ({
  doctors,
  userCoordinates,
  showUserLocation = false,
  onDoctorSelect
}: DoctorMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(true);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  
  // Track if markers have been added for current doctors to prevent duplicates
  const markersAddedRef = useRef<boolean>(false);
  const lastDoctorIdsRef = useRef<string>('');

  // Try to get token from localStorage first, then from service
  useEffect(() => {
    async function loadMapboxToken() {
      setIsLoadingToken(true);
      try {
        // First check localStorage
        const cachedToken = localStorage.getItem('mapbox_token');
        if (cachedToken) {
          console.log('Using cached Mapbox token from localStorage');
          setMapboxToken(cachedToken);
          mapboxgl.accessToken = cachedToken;
          setIsLoadingToken(false);
          return;
        }

        // If no cached token, try to get from service
        const { getMapboxToken } = await import('@/services/mapbox');
        const token = await getMapboxToken();
        
        if (token) {
          console.log('Retrieved Mapbox token from service');
          setMapboxToken(token);
          mapboxgl.accessToken = token;
          // Cache it for future use
          localStorage.setItem('mapbox_token', token);
        }
      } catch (error) {
        console.error("Error loading Mapbox token:", error);
      } finally {
        setIsLoadingToken(false);
      }
    }
    
    loadMapboxToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) {
      return;
    }

    console.log('Initializing map with token and coordinates:', userCoordinates);

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: userCoordinates 
          ? [userCoordinates.lon, userCoordinates.lat]
          : [6.1296, 49.8153], // Default to Luxembourg
        zoom: userCoordinates ? 12 : 9
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Set map loaded flag when map is ready
      map.current.on('load', () => {
        console.log('Map loaded and ready');
        setIsMapLoaded(true);
      });

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        console.log('Cleaning up map');
        // Clear all markers first
        clearAllMarkers();
        map.current.remove();
        map.current = null;
        setIsMapLoaded(false);
        markersAddedRef.current = false;
        lastDoctorIdsRef.current = '';
      }
    };
  }, [mapboxToken]);

  // Function to clear all markers
  const clearAllMarkers = () => {
    // Remove doctor markers
    markers.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    });
    markers.current = [];

    // Remove user location marker
    if (userLocationMarker.current) {
      try {
        userLocationMarker.current.remove();
      } catch (error) {
        console.error('Error removing user marker:', error);
      }
      userLocationMarker.current = null;
    }
  };

  // Add user location marker
  useEffect(() => {
    if (!map.current || !isMapLoaded || !showUserLocation || !userCoordinates?.lat || !userCoordinates?.lon) {
      return;
    }

    // Remove existing user location marker
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
      userLocationMarker.current = null;
    }

    console.log('Adding user location marker at:', userCoordinates);
    
    const userLocationElement = document.createElement('div');
    userLocationElement.className = 'w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg';
    userLocationElement.style.width = '16px';
    userLocationElement.style.height = '16px';

    userLocationMarker.current = new mapboxgl.Marker({ 
      element: userLocationElement,
      anchor: 'center' 
    })
      .setLngLat([userCoordinates.lon, userCoordinates.lat])
      .addTo(map.current);
  }, [showUserLocation, userCoordinates, isMapLoaded]);

  // Add doctor markers - with proper deduplication
  useEffect(() => {
    if (!map.current || !isMapLoaded || !mapboxToken) {
      return;
    }

    // Create a unique identifier for the current doctors list
    const currentDoctorIds = doctors.map(d => d.id).sort().join(',');
    
    // Only update markers if doctors list has actually changed
    if (currentDoctorIds === lastDoctorIdsRef.current && markersAddedRef.current) {
      console.log('Doctor list unchanged, skipping marker update');
      return;
    }

    console.log(`Adding ${doctors.length} doctor markers to map`);
    
    // Clear existing markers before adding new ones
    clearAllMarkers();
    markersAddedRef.current = false;
    
    const doctorsWithCoordinates = doctors.filter(doctor => 
      doctor.coordinates?.lat && doctor.coordinates?.lon
    );
    
    console.log(`Filtered to ${doctorsWithCoordinates.length} doctors with valid coordinates`);
    
    doctorsWithCoordinates.forEach(doctor => {
      if (!doctor.coordinates?.lat || !doctor.coordinates?.lon) return;
      
      const doctorLat = parseFloat(String(doctor.coordinates.lat));
      const doctorLon = parseFloat(String(doctor.coordinates.lon));
      
      if (isNaN(doctorLat) || isNaN(doctorLon)) {
        console.log(`Skipping doctor ${doctor.id} due to invalid coordinates`, doctor.coordinates);
        return;
      }
      
      console.log(`Adding marker for doctor ${doctor.full_name} at [${doctorLon}, ${doctorLat}]`);
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'cursor-pointer transform hover:scale-110 transition-transform duration-200';
      markerElement.innerHTML = `
        <div class="relative">
          <div class="w-8 h-8 bg-white border-2 border-red-500 rounded-full shadow-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
        </div>
      `;

      // Get distance string if available
      let distanceStr = '';
      if (doctor.distance) {
        distanceStr = `${doctor.distance} km away`;
      }

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        className: 'doctor-popup'
      }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-semibold text-base mb-2">${doctor.full_name}</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              ${doctor.city || doctor.address || 'Location not specified'}
            </div>
            ${distanceStr ? `<div class="text-red-600 font-medium">${distanceStr}</div>` : ''}
            ${doctor.phone ? `
              <div class="flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                ${doctor.phone}
              </div>
            ` : ''}
          </div>
          <div class="mt-3">
            <button onclick="window.selectDoctor('${doctor.id}')" class="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors">
              Connect with Doctor
            </button>
          </div>
        </div>
      `);

      // Create and add marker
      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([doctorLon, doctorLat])
        .setPopup(popup)
        .addTo(map.current!);
        
      // Add click handler
      markerElement.addEventListener('click', () => {
        console.log('Doctor marker clicked:', doctor.id);
        onDoctorSelect(doctor.id);
      });
      
      markers.current.push(marker);
    });
    
    console.log(`Successfully added ${markers.current.length} markers to the map`);
    markersAddedRef.current = true;
    lastDoctorIdsRef.current = currentDoctorIds;
    
    // Set up global function for popup button clicks
    (window as any).selectDoctor = (doctorId: string) => {
      console.log('Doctor selected from popup:', doctorId);
      onDoctorSelect(doctorId);
    };

    // Fit map to show all markers
    if (markers.current.length > 0) {
      console.log('Fitting map to show all markers');
      const bounds = new mapboxgl.LngLatBounds();
      
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      // Add user location to bounds if available
      if (userCoordinates?.lat && userCoordinates?.lon) {
        bounds.extend([userCoordinates.lon, userCoordinates.lat]);
      }
      
      map.current!.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 13,
        duration: 1000
      });
    }
  }, [doctors, onDoctorSelect, isMapLoaded, mapboxToken]);

  const handleSetToken = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      localStorage.setItem('mapbox_token', tokenInput.trim());
      mapboxgl.accessToken = tokenInput.trim();
      console.log('Token set manually:', tokenInput.trim());
    }
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
      {!mapboxToken && !isLoadingToken ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <Map className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Map requires Mapbox token</h3>
            <p className="text-gray-600 text-sm">
              Please enter your Mapbox public token to display the interactive map with doctor locations.
            </p>
            <p className="text-xs text-gray-500">
              You can get a free token at{' '}
              <a href="https://mapbox.com/" className="text-red-600 underline" target="_blank" rel="noopener noreferrer">
                mapbox.com
              </a>
            </p>
            
            <div className="flex gap-2 mt-4">
              <Input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter Mapbox token"
                className="flex-1"
              />
              <Button onClick={handleSetToken} type="button" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Set Token
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Your token will be saved locally for future use.
            </p>
          </div>
        </div>
      ) : isLoadingToken ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Map className="h-10 w-10 text-red-600/60 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
      
      {/* Custom popup styles */}
      <style>
        {`
        .doctor-popup .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
        }
        
        .doctor-popup .mapboxgl-popup-tip {
          border-top-color: #e5e7eb;
        }
        `}
      </style>
    </div>
  );
};

export default DoctorMap;

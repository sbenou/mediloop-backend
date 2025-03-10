// This service uses Mapbox Geocoding API for fetching address information
// It provides better search functionality and more reliable results

interface AddressResult {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    formatted?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

// Mapbox public token - You should replace this with your own token
// To get your own token, sign up at https://mapbox.com/
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibG92YWJsZS10ZXN0IiwiYSI6ImNscmN0ZG96ZjBjemsyaXQ0Nm8zcnhkY2MifQ.IYYu7fJKa45S4TXxTV6-KA';

// Load Mapbox Search SDK script
export function loadMapboxSearchSDK() {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById('mapbox-search-sdk')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'mapbox-search-sdk';
    script.src = 'https://api.mapbox.com/search-js/v1.0.0-beta.18/web.js';
    script.async = true;
    script.onload = () => {
      console.log('Mapbox Search SDK loaded successfully');
      resolve();
    };
    script.onerror = (error) => {
      console.error('Failed to load Mapbox Search SDK:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

// Initialize Mapbox Search Autofill
export function initializeMapboxAutofill(inputElement: HTMLInputElement, formElement: HTMLFormElement, options = {}) {
  if (typeof window.MapboxSearchSDK === 'undefined') {
    console.error('Mapbox Search SDK is not loaded yet');
    return null;
  }
  
  try {
    return window.MapboxSearchSDK.autofill({
      accessToken: MAPBOX_ACCESS_TOKEN,
      options: {
        country: 'lu',
        language: 'en',
        ...options
      }
    });
  } catch (error) {
    console.error('Error initializing Mapbox Autofill:', error);
    return null;
  }
}

// Confirm address before submission
export async function confirmMapboxAddress(formElement: HTMLFormElement, minimap = true) {
  if (typeof window.MapboxSearchSDK === 'undefined') {
    console.error('Mapbox Search SDK is not loaded yet');
    return { type: 'nochange' };
  }
  
  try {
    return await window.MapboxSearchSDK.confirmAddress(formElement, {
      accessToken: MAPBOX_ACCESS_TOKEN,
      minimap,
      skipConfirmModal: (feature: any) => 
        ['exact', 'high'].includes(feature.properties.match_code?.confidence)
    });
  } catch (error) {
    console.error('Error confirming address with Mapbox:', error);
    return { type: 'nochange' };
  }
}

// Create a Mapbox Minimap element
export function createMapboxMinimap(feature: any) {
  if (typeof window.MapboxSearchSDK === 'undefined') {
    console.error('Mapbox Search SDK is not loaded yet');
    return null;
  }
  
  try {
    const minimap = new window.MapboxSearchSDK.MapboxAddressMinimap({
      accessToken: MAPBOX_ACCESS_TOKEN,
    });
    
    if (feature) {
      minimap.feature = feature;
    }
    
    return minimap;
  } catch (error) {
    console.error('Error creating Mapbox Minimap:', error);
    return null;
  }
}

export async function fetchAddressFromPostcode(postcode: string): Promise<AddressResult> {
  try {
    if (!postcode || postcode.length < 3) {
      console.log('Postcode too short, not searching');
      return {};
    }

    console.log('Fetching address from postcode with Mapbox API:', postcode);
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=postcode&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Mapbox address API response:', data);
    
    if (data.features && data.features.length > 0) {
      const result = data.features[0];
      
      // Extract place data
      const context = result.context || [];
      let city = '', state = '', country = '';
      
      // Extract address components from context
      context.forEach((ctx: any) => {
        if (ctx.id.startsWith('place')) {
          city = ctx.text;
        } else if (ctx.id.startsWith('region')) {
          state = ctx.text;
        } else if (ctx.id.startsWith('country')) {
          country = ctx.text;
        }
      });
      
      // Extract street name if available
      const addressParts = result.place_name.split(',');
      const street = addressParts.length > 1 ? addressParts[0].trim() : '';
      
      return {
        address: {
          street: street,
          city: city,
          state: state,
          country: country,
          formatted: result.place_name
        },
        coordinates: {
          lat: result.center[1],
          lng: result.center[0]
        }
      };
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching address from Mapbox:', error);
    return {};
  }
}

export async function searchAddressesByQuery(query: string): Promise<AddressSuggestion[]> {
  try {
    // Only search when we have a meaningful query
    if (!query || query.length < 3) {
      console.log('Query too short, not searching');
      return [];
    }

    console.log('Starting Mapbox search for:', query);
    
    // Configure search with broader types for better results
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=address,poi,place,locality&limit=5&autocomplete=true`;
    
    console.log('Searching addresses with Mapbox API query:', query);
    console.log('Request URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Mapbox address search API response:', data);
    
    if (data.features && data.features.length > 0) {
      // Map the Mapbox results to our AddressSuggestion format
      return data.features.map((feature: any) => {
        // Extract components from the place_name
        const addressParts = feature.place_name.split(',').map((part: string) => part.trim());
        
        // Find postal code in the text (usually in the format "12345")
        const postalCodeMatch = feature.place_name.match(/\b\d{5}\b/);
        const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';
        
        // Extract the street (first part of the address usually)
        const street = addressParts[0];
        
        // Extract city, country from context if available
        let city = '', country = '';
        if (feature.context) {
          feature.context.forEach((ctx: any) => {
            if (ctx.id.startsWith('place')) {
              city = ctx.text;
            } else if (ctx.id.startsWith('country')) {
              country = ctx.text;
            }
          });
        }
        
        // If we couldn't extract city from context, try to get it from address parts
        if (!city && addressParts.length > 1) {
          city = addressParts[1];
        }
        
        // If we couldn't extract country from context, use the last part
        if (!country && addressParts.length > 2) {
          country = addressParts[addressParts.length - 1];
        }
        
        return {
          street: street,
          city: city,
          postal_code: postalCode,
          country: country,
          formatted: feature.place_name
        };
      });
    }
    
    console.log('No address results found from Mapbox');
    return [];
  } catch (error) {
    console.error('Error searching addresses with Mapbox:', error);
    return [];
  }
}

// Add TypeScript interface for window to access Mapbox Search SDK
declare global {
  interface Window {
    MapboxSearchSDK: any;
  }
}

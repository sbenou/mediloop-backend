
// This service uses Mapbox Search SDK for address autofill and confirmation

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

// Mapbox public token - You should replace this with your own token
// To get your own token, sign up at https://mapbox.com/
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibG92YWJsZS10ZXN0IiwiYSI6ImNscmN0ZG96ZjBjemsyaXQ0Nm8zcnhkY2MifQ.IYYu7fJKa45S4TXxTV6-KA';

let sdkLoadPromise: Promise<void> | null = null;
let sdkLoaded = false;

// Load Mapbox Search SDK script
export function loadMapboxSearchSDK() {
  // Return immediately if SDK is already loaded
  if (sdkLoaded && window.MapboxSearchSDK) {
    console.log('Mapbox Search SDK already loaded');
    return Promise.resolve();
  }
  
  if (sdkLoadPromise) {
    console.log('Mapbox Search SDK loading in progress, returning existing promise');
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.MapboxSearchSDK) {
      console.log('Mapbox Search SDK already loaded');
      window.MapboxSearchSDK.config.accessToken = MAPBOX_ACCESS_TOKEN;
      sdkLoaded = true;
      resolve();
      return;
    }
    
    // Check if script tag already exists
    const existingScript = document.getElementById('mapbox-search-sdk');
    if (existingScript) {
      console.log('Mapbox Search SDK script tag exists, waiting for initialization');
      
      const checkInterval = setInterval(() => {
        if (window.MapboxSearchSDK) {
          clearInterval(checkInterval);
          window.MapboxSearchSDK.config.accessToken = MAPBOX_ACCESS_TOKEN;
          console.log('Mapbox Search SDK initialized after waiting');
          sdkLoaded = true;
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        if (!window.MapboxSearchSDK) {
          clearInterval(checkInterval);
          console.error('Timed out waiting for Mapbox Search SDK to initialize');
          sdkLoadPromise = null;
          reject(new Error('Timed out waiting for Mapbox Search SDK'));
        }
      }, 10000);
      
      return;
    }
    
    // Create and load the script
    console.log('Creating Mapbox Search SDK script tag');
    const script = document.createElement('script');
    script.id = 'mapbox-search-sdk';
    script.src = 'https://api.mapbox.com/search-js/v1.0.0-beta.18/web.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Mapbox Search SDK script loaded, waiting for initialization');
      
      const waitForSDK = setInterval(() => {
        if (window.MapboxSearchSDK) {
          clearInterval(waitForSDK);
          window.MapboxSearchSDK.config.accessToken = MAPBOX_ACCESS_TOKEN;
          console.log('Mapbox Search SDK initialized');
          sdkLoaded = true;
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        if (!window.MapboxSearchSDK) {
          clearInterval(waitForSDK);
          console.error('Timed out waiting for Mapbox Search SDK to initialize');
          sdkLoadPromise = null;
          reject(new Error('Timed out waiting for Mapbox Search SDK'));
        }
      }, 5000);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Mapbox Search SDK:', error);
      sdkLoadPromise = null;
      reject(error);
    };
    
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

// Initialize Mapbox Search Autofill (kept for backwards compatibility)
export function initializeMapboxAutofill(inputElement: HTMLInputElement, formElement: HTMLFormElement, options = {}) {
  if (typeof window.MapboxSearchSDK === 'undefined') {
    console.error('Mapbox Search SDK is not loaded yet');
    return null;
  }
  
  try {
    // Ensure the input element has the required attributes
    inputElement.setAttribute('autocomplete', 'street-address');
    
    // Create the autofill instance using the documented approach
    const collection = window.MapboxSearchSDK.autofill({
      accessToken: MAPBOX_ACCESS_TOKEN,
      options: {
        ...options
      }
    });
    
    if (collection) {
      console.log('Mapbox Autofill initialized successfully');
      // Force an update to ensure proper initialization
      setTimeout(() => {
        if (collection.update) {
          collection.update();
        }
      }, 100);
    } else {
      console.warn('Mapbox Autofill initialization returned null');
    }
    
    return collection;
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

// Legacy functions kept for backward compatibility
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

export async function searchAddressesByQuery(query: string): Promise<any[]> {
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


/// <reference types="vite/client" />

// Add type declarations for leaflet-draw to avoid TypeScript errors
declare module 'leaflet-draw' {
  export = L;
}

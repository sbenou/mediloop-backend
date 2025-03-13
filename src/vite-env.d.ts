
/// <reference types="vite/client" />

// Add type declarations for leaflet-draw to avoid TypeScript errors
declare module 'leaflet-draw' {
  export = L;
}

// Add type declarations for react-leaflet components
declare module 'react-leaflet' {
  import { FC, ReactNode, CSSProperties } from 'react';
  import L from 'leaflet';
  
  export interface MapContainerProps {
    center: [number, number];
    zoom: number;
    scrollWheelZoom?: boolean;
    style?: CSSProperties;
    className?: string;
    key?: string;
    children?: ReactNode | ReactNode[];
    [key: string]: any;
  }
  
  export interface TileLayerProps {
    url: string;
    attribution: string;
    key?: string;
    [key: string]: any;
  }
  
  export interface MarkerProps {
    position: [number, number];
    key?: string;
    children?: ReactNode;
    [key: string]: any;
  }
  
  export interface PopupProps {
    children?: ReactNode;
    [key: string]: any;
  }
  
  export const MapContainer: FC<MapContainerProps>;
  export const TileLayer: FC<TileLayerProps>;
  export const Marker: FC<MarkerProps>;
  export const Popup: FC<PopupProps>;
  export function useMap(): L.Map;
}


/// <reference types="vite/client" />

declare module 'leaflet-draw' {
  import L from 'leaflet';
  
  namespace L {
    namespace Draw {
      namespace Event {
        const CREATED: string;
        const EDITED: string;
        const DELETED: string;
        const DRAWSTART: string;
        const DRAWSTOP: string;
        const DRAWVERTEX: string;
        const EDITSTART: string;
        const EDITMOVE: string;
        const EDITRESIZE: string;
        const EDITVERTEX: string;
        const EDITSTOP: string;
        const DELETESTART: string;
        const DELETESTOP: string;
      }
    }
    
    namespace control {
      interface DrawConstructorOptions {
        edit?: {
          featureGroup: L.FeatureGroup;
          poly?: {
            allowIntersection?: boolean;
          };
          remove?: boolean;
        };
        draw?: {
          polyline?: object | boolean;
          polygon?: object | boolean;
          rectangle?: object | boolean;
          circle?: object | boolean;
          marker?: object | boolean;
          circlemarker?: object | boolean;
        };
      }
    }
    
    class Control {
      static Draw: new (options?: control.DrawConstructorOptions) => Control.Draw;
    }
    
    namespace Control {
      class Draw extends L.Control {
        constructor(options?: control.DrawConstructorOptions);
      }
    }
  }
  
  export = L;
}

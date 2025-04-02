
import { PencilBrush } from 'fabric';

declare module 'fabric' {
  interface Canvas {
    setBrush: (brush: PencilBrush) => void;
    getBrush: () => PencilBrush;
    freeDrawingCursor: string;
    wrapperEl: HTMLElement;
  }
}


import { Canvas as FabricCanvas } from 'fabric';
import {
  bringObjectForward as bringObjectForwardUtil,
  sendObjectBackward as sendObjectBackwardUtil,
  bringObjectToFront as bringObjectToFrontUtil,
  sendObjectToBack as sendObjectToBackUtil
} from '../utils';

export interface UseLayerManagementProps {
  canvas: FabricCanvas | null;
}

export const useLayerManagement = ({ canvas }: UseLayerManagementProps) => {
  // Layer management
  const handleBringForward = () => {
    if (canvas) {
      bringObjectForwardUtil(canvas);
    }
  };
  
  const handleSendBackward = () => {
    if (canvas) {
      sendObjectBackwardUtil(canvas);
    }
  };
  
  const handleBringToFront = () => {
    if (canvas) {
      bringObjectToFrontUtil(canvas);
    }
  };
  
  const handleSendToBack = () => {
    if (canvas) {
      sendObjectToBackUtil(canvas);
    }
  };

  return {
    handleBringForward,
    handleSendBackward,
    handleBringToFront,
    handleSendToBack
  };
};

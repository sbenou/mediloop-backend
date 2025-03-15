
import React from 'react';
import MenuBar from './MenuBar';
import SaveButton from './SaveButton';
import { StampTemplate } from '../utils';

// Extract only the props needed for this container component
interface ControlsContainerProps {
  children: React.ReactNode;
  saveCanvas: () => void;
  isLoading: boolean;
  type: 'stamp' | 'signature';
}

const ControlsContainer: React.FC<ControlsContainerProps> = ({
  children,
  saveCanvas,
  isLoading,
  type
}) => {
  return (
    <div className="space-y-3">
      {children}
      
      <SaveButton 
        saveCanvas={saveCanvas} 
        isLoading={isLoading} 
        type={type} 
      />
    </div>
  );
};

export default ControlsContainer;

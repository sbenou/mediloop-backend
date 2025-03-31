
import React from 'react';

// Extract only the props needed for this container component
interface ControlsContainerProps {
  children: React.ReactNode;
}

const ControlsContainer: React.FC<ControlsContainerProps> = ({
  children
}) => {
  return (
    <div className="space-y-3">
      {children}
    </div>
  );
};

export default ControlsContainer;

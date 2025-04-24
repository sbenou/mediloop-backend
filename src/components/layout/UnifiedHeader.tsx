
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface UnifiedHeaderProps {
  showBackLink?: boolean;
  onBackClick?: () => void;
  showUserMenu?: boolean;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  showBackLink = false,
  onBackClick,
  showUserMenu = true,
}) => {
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackLink ? (
            <button 
              onClick={handleBackClick} 
              className="flex items-center text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          ) : null}
        </div>
        <div className="flex items-center space-x-4">
          {/* User menu and other elements will be added here if needed */}
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;

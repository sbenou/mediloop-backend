
import { useEffect, useState, useRef, useCallback } from 'react';

interface UseUnsavedNavigationWarningProps {
  shouldBlock: boolean;
  onSave: () => void;
  onDismiss: () => void;
}

const useUnsavedNavigationWarning = ({ 
  shouldBlock, 
  onSave, 
  onDismiss 
}: UseUnsavedNavigationWarningProps) => {
  const [showModal, setShowModal] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const nextUrlRef = useRef<string | null>(null);

  // Handle beforeunload event for browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlock) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);

  // For in-app navigation interception (for links/buttons)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestAnchor = target.closest('a');
      
      if (closestAnchor && shouldBlock) {
        const href = closestAnchor.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          e.preventDefault();
          nextUrlRef.current = href;
          setNextRoute(href);
          setShowModal(true);
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [shouldBlock]);

  // Handle save and continue navigation
  const handleSaveAndContinue = useCallback(() => {
    onSave();
    setShowModal(false);
    if (nextUrlRef.current) {
      window.location.href = nextUrlRef.current;
    }
  }, [onSave]);
  
  // Handle dismiss and continue navigation
  const handleDismissAndContinue = useCallback(() => {
    onDismiss();
    setShowModal(false);
    if (nextUrlRef.current) {
      window.location.href = nextUrlRef.current;
    }
  }, [onDismiss]);
  
  // Cancel navigation attempt
  const handleCancelNavigation = useCallback(() => {
    setShowModal(false);
    nextUrlRef.current = null;
  }, []);

  return {
    showModal,
    setShowModal,
    nextRoute,
    handleSaveAndContinue,
    handleDismissAndContinue,
    handleCancelNavigation
  };
};

export default useUnsavedNavigationWarning;


import { useEffect, useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';

interface UseUnsavedChangesWarningProps {
  isDirty: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
}

export const useUnsavedChangesWarning = ({ 
  isDirty, 
  onSave, 
  onDiscard 
}: UseUnsavedChangesWarningProps) => {
  const [toastId, setToastId] = useState<string | number | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [attemptedNavigation, setAttemptedNavigation] = useState(false);
  const nextUrlRef = useRef<string | null>(null);
  
  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        // Show standard browser dialog
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
  
  // Route change interception in React projects
  useEffect(() => {
    // This would need to be implemented with your specific router (React Router, Next.js, etc.)
    // The implementation details depend on your specific routing library
    
    // Example placeholder for React Router or similar:
    // router.events.on('routeChangeStart', handleRouteChangeStart);
    // return () => router.events.off('routeChangeStart', handleRouteChangeStart);
    
    return () => {
      // If component is unmounting and we have unsaved changes, show warning
      if (isDirty && !attemptedNavigation) {
        showWarningToast();
      }
    };
  }, [isDirty, attemptedNavigation]);
  
  // Show warning toast with action buttons
  const showWarningToast = useCallback(() => {
    if (isDirty) {
      const id = toast.warning("You have unsaved changes", {
        description: "Would you like to save your work before leaving?",
        action: {
          label: "Save",
          onClick: async () => {
            await onSave();
            onDiscard();
            setAttemptedNavigation(true);
            // If using a router, you would redirect here
            // router.push(nextUrlRef.current || '/');
          }
        },
        cancel: {
          label: "Discard",
          onClick: () => {
            onDiscard();
            setAttemptedNavigation(true);
            // If using a router, you would redirect here
            // router.push(nextUrlRef.current || '/');
          }
        },
        duration: Infinity, // Toast stays until user interaction
      });
      
      setToastId(id);
    }
  }, [isDirty, onSave, onDiscard]);
  
  // Show modal instead of toast (more robust UX)
  const showWarningModal = useCallback(() => {
    if (isDirty) {
      setShowModal(true);
    }
  }, [isDirty]);
  
  // Handle saving and continuing navigation
  const handleSaveAndLeave = useCallback(async () => {
    await onSave();
    setShowModal(false);
    setAttemptedNavigation(true);
    // If using a router, you would redirect here
    // router.push(nextUrlRef.current || '/');
  }, [onSave]);
  
  // Handle discarding and continuing navigation
  const handleDiscardAndLeave = useCallback(() => {
    onDiscard();
    setShowModal(false);
    setAttemptedNavigation(true);
    // If using a router, you would redirect here
    // router.push(nextUrlRef.current || '/');
  }, [onDiscard]);
  
  // Cancel navigation attempt
  const handleCancelNavigation = useCallback(() => {
    setShowModal(false);
    nextUrlRef.current = null;
  }, []);
  
  // Cleanup toast when component unmounts or isDirty changes
  useEffect(() => {
    return () => {
      if (toastId !== undefined) {
        toast.dismiss(toastId);
      }
    };
  }, [toastId]);
  
  return { 
    showWarningToast, 
    showWarningModal, 
    showModal, 
    handleSaveAndLeave, 
    handleDiscardAndLeave, 
    handleCancelNavigation 
  };
};

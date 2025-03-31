
import { useEffect, useCallback, useState } from 'react';
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
          }
        },
        cancel: {
          label: "Dismiss",
          onClick: () => {
            onDiscard();
          }
        },
        duration: Infinity, // Toast stays until user interaction
      });
      
      setToastId(id);
    }
  }, [isDirty, onSave, onDiscard]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        // Show standard browser dialog
        event.preventDefault();
        event.returnValue = '';
        // Note: Custom message not supported in most modern browsers for security reasons
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
  
  // Cleanup toast when component unmounts or isDirty changes
  useEffect(() => {
    return () => {
      if (toastId !== undefined) {
        toast.dismiss(toastId);
      }
    };
  }, [toastId]);
  
  return { showWarningToast };
};

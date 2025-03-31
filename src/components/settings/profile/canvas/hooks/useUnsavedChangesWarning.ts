
import { useEffect, useCallback } from 'react';
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
  
  // Show warning toast with action buttons
  const showWarningToast = useCallback(() => {
    if (isDirty) {
      toast.warning("You have unsaved changes", {
        description: "Would you like to save your work before leaving?",
        action: {
          label: "Save",
          onClick: async () => {
            await onSave();
            onDiscard();
          }
        },
        cancel: {
          label: "Discard",
          onClick: () => {
            onDiscard();
          }
        },
        duration: 10000, // 10 seconds
      });
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
  
  return { showWarningToast };
};


import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesModalProps {
  open: boolean;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onCancel: () => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  onSaveAndLeave,
  onDiscardAndLeave,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You have unsaved changes</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Would you like to save your work before leaving this page?
        </p>
        <DialogFooter className="mt-4">
          <Button onClick={onSaveAndLeave}>Save and Leave</Button>
          <Button variant="destructive" onClick={onDiscardAndLeave}>
            Leave Without Saving
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnsavedChangesModal;

import { Button } from "@/components/ui/button";
import { FileEdit, FilePlus, Trash2, Send } from "lucide-react";

interface PrescriptionActionsProps {
  onNew: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSend: () => void;
}

const PrescriptionActions = ({ onNew, onEdit, onDelete, onSend }: PrescriptionActionsProps) => {
  return (
    <div className="flex flex-wrap gap-4 justify-end pt-4 border-t">
      <Button
        variant="outline"
        onClick={onNew}
        className="gap-2"
      >
        <FilePlus className="w-4 h-4" />
        New Prescription
      </Button>
      <Button
        variant="outline"
        onClick={onEdit}
        className="gap-2"
      >
        <FileEdit className="w-4 h-4" />
        Modify
      </Button>
      <Button
        variant="destructive"
        onClick={onDelete}
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
      <Button
        onClick={onSend}
        className="gap-2"
      >
        <Send className="w-4 h-4" />
        Send to Pharmacy
      </Button>
    </div>
  );
};

export default PrescriptionActions;
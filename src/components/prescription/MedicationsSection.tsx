import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import MedicationFields from "../MedicationFields";

interface MedicationsSectionProps {
  form: UseFormReturn<any>;
  onAddMedication: () => void;
}

const MedicationsSection = ({ form, onAddMedication }: MedicationsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-primary">Medications</h3>
      {form.watch("medications").map((_, index: number) => (
        <MedicationFields key={index} form={form} index={index} />
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={onAddMedication}
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Another Medication
      </Button>
    </div>
  );
};

export default MedicationsSection;
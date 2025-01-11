import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PharmacyDefaultToggleProps {
  id: string;
  isDefault: boolean;
  onDefaultChange: (checked: boolean) => void;
}

const PharmacyDefaultToggle = ({
  id,
  isDefault,
  onDefaultChange,
}: PharmacyDefaultToggleProps) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Checkbox
        id={`default-${id}`}
        checked={isDefault}
        onCheckedChange={onDefaultChange}
      />
      <Label htmlFor={`default-${id}`}>Set as default pharmacy</Label>
    </div>
  );
};

export default PharmacyDefaultToggle;
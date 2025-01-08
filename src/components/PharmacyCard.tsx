import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PharmacyCardProps {
  id: string;
  name: string;
  address: string;
  hours: string;
  distance?: string;
  isDefault?: boolean;
  onSelect: (id: string) => void;
  onSetDefault: (id: string, isDefault: boolean) => void;
}

const PharmacyCard = ({
  id,
  name,
  address,
  hours,
  distance,
  isDefault,
  onSelect,
  onSetDefault,
}: PharmacyCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id={`default-${id}`}
            checked={isDefault}
            onCheckedChange={(checked) => onSetDefault(id, checked as boolean)}
          />
          <Label htmlFor={`default-${id}`}>Set as default pharmacy</Label>
        </div>
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{address}</p>
        <p className="text-sm text-muted-foreground mb-4">{hours}</p>
        {distance && (
          <p className="text-sm font-medium text-primary">{distance}</p>
        )}
        <button
          onClick={() => onSelect(id)}
          className="mt-4 w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
        >
          Order
        </button>
      </div>
    </Card>
  );
};

export default PharmacyCard;
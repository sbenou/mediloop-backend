import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Mail, Phone } from "lucide-react";

interface PharmacyCardProps {
  id: string;
  name: string;
  address: string;
  hours: string;
  distance?: string;
  email?: string;
  phone?: string;
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
  email,
  phone,
  isDefault = false,
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
            onCheckedChange={(checked) => {
              onSetDefault(id, checked as boolean);
            }}
          />
          <Label htmlFor={`default-${id}`}>Set as default pharmacy</Label>
        </div>
        
        <h3 className="text-lg font-semibold mb-4">{name}</h3>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{address}</span>
          </div>
          
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{hours}</span>
          </div>
          
          {email && (
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{email}</span>
            </div>
          )}
          
          {phone && (
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{phone}</span>
            </div>
          )}
        </div>

        {distance && (
          <p className="text-sm font-medium text-primary mb-4">{distance}</p>
        )}

        <button
          onClick={() => onSelect(id)}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Order
        </button>
      </div>
    </Card>
  );
};

export default PharmacyCard;
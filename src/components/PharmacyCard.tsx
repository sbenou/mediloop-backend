import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import PharmacyDetails from "./pharmacy/PharmacyDetails";
import PharmacyDefaultToggle from "./pharmacy/PharmacyDefaultToggle";

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
  const handleDefaultChange = async (checked: boolean) => {
    try {
      await onSetDefault(id, checked);
      toast({
        title: checked ? "Default pharmacy set" : "Default pharmacy removed",
        description: checked 
          ? `${name} has been set as your default pharmacy.`
          : `${name} is no longer your default pharmacy.`,
      });
    } catch (error) {
      console.error('Error setting default pharmacy:', error);
      toast({
        title: "Error",
        description: "Failed to update default pharmacy. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <PharmacyDefaultToggle
          id={id}
          isDefault={isDefault}
          onDefaultChange={handleDefaultChange}
        />
        
        <h3 className="text-lg font-semibold mb-4">{name}</h3>
        
        <PharmacyDetails
          address={address}
          hours={hours}
          email={email}
          phone={phone}
          distance={distance}
        />

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
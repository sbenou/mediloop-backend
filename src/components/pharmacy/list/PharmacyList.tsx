
import { Card } from "@/components/ui/card";
import PharmacyCard from "@/components/PharmacyCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PharmacyListProps {
  pharmacies: any[];
  isLoading: boolean;
  defaultPharmacyId: string | null;
  onPharmacySelect: (pharmacyId: string) => void;
  onSetDefaultPharmacy: (pharmacyId: string, isDefault: boolean) => void;
  showDefaultLocation: boolean;
  onLocationToggle: (checked: boolean) => void;
}

export function PharmacyList({
  pharmacies,
  isLoading,
  defaultPharmacyId,
  onPharmacySelect,
  onSetDefaultPharmacy,
  showDefaultLocation,
  onLocationToggle
}: PharmacyListProps) {
  return (
    <div className="overflow-y-auto space-y-4 pr-4 relative z-50">
      <div className="flex items-center space-x-2 p-4 bg-white rounded-lg shadow">
        <Switch
          id="show-location"
          checked={showDefaultLocation}
          onCheckedChange={onLocationToggle}
        />
        <Label htmlFor="show-location">Show my location</Label>
      </div>

      {isLoading && (
        <>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </>
      )}

      {pharmacies.map((pharmacy) => (
        <PharmacyCard
          key={pharmacy.id}
          {...pharmacy}
          onSelect={onPharmacySelect}
          onSetDefault={onSetDefaultPharmacy}
          isDefault={defaultPharmacyId === pharmacy.id}
        />
      ))}

      {pharmacies.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">No pharmacies found in this area</p>
      )}
    </div>
  );
}

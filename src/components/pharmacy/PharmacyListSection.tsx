import { Card } from "@/components/ui/card";
import PharmacyCard from "@/components/PharmacyCard";

interface PharmacyListSectionProps {
  pharmacies: any[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number } | null;
  defaultPharmacyId: string | null;
  onPharmacySelect: (pharmacyId: string) => void;
  onSetDefaultPharmacy: (pharmacyId: string, isDefault: boolean) => void;
}

const PharmacyListSection = ({
  pharmacies,
  isLoading,
  coordinates,
  defaultPharmacyId,
  onPharmacySelect,
  onSetDefaultPharmacy
}: PharmacyListSectionProps) => {
  return (
    <>
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pharmacies?.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            {...pharmacy}
            onSelect={onPharmacySelect}
            onSetDefault={onSetDefaultPharmacy}
            isDefault={defaultPharmacyId === pharmacy.id}
          />
        ))}
      </div>

      {pharmacies?.length === 0 && coordinates && !isLoading && (
        <p className="text-center text-gray-500">No pharmacies found in this area</p>
      )}
    </>
  );
};

export default PharmacyListSection;
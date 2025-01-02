import PharmacyCard from "@/components/PharmacyCard";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
  email: string;
}

interface PharmacyListProps {
  pharmacies: Pharmacy[];
  onSelect: (pharmacyId: string) => void;
  onSetDefault: (pharmacyId: string, isDefault: boolean) => void;
  defaultPharmacyId: string | null;
}

const PharmacyList = ({ 
  pharmacies, 
  onSelect, 
  onSetDefault, 
  defaultPharmacyId 
}: PharmacyListProps) => {
  return (
    <div className="space-y-4 animate-slide-up">
      <h2 className="text-xl font-semibold text-primary">Select a Pharmacy</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {pharmacies.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            {...pharmacy}
            onSelect={onSelect}
            onSetDefault={onSetDefault}
            isDefault={defaultPharmacyId === pharmacy.id}
          />
        ))}
      </div>
    </div>
  );
};

export default PharmacyList;
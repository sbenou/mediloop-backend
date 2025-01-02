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
  onSelect: (pharmacyName: string) => void;
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
            id={pharmacy.id}
            name={pharmacy.name}
            address={pharmacy.address}
            distance={pharmacy.distance}
            hours={pharmacy.hours}
            phone={pharmacy.phone}
            email={pharmacy.email}
            onSelect={() => onSelect(pharmacy.name)}
            onSetDefault={(isDefault) => onSetDefault(pharmacy.id, isDefault)}
            isDefault={defaultPharmacyId === pharmacy.id}
            showUpload={true}
          />
        ))}
      </div>
    </div>
  );
};

export default PharmacyList;
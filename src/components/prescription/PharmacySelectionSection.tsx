import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import PharmacyList from "./PharmacyList";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
  email: string;
}

interface PharmacySelectionSectionProps {
  pharmacies: Pharmacy[];
  onClose: () => void;
}

const PharmacySelectionSection = ({ pharmacies, onClose }: PharmacySelectionSectionProps) => {
  const [defaultPharmacyId, setDefaultPharmacyId] = useState<string | null>(null);

  const handleSendToPharmacy = (pharmacyId: string) => {
    const pharmacy = pharmacies.find(p => p.id === pharmacyId);
    if (pharmacy) {
      toast({
        title: "Prescription Sent",
        description: `The prescription has been sent to ${pharmacy.name}.`,
      });
      onClose();
    }
  };

  const handleSetDefaultPharmacy = (pharmacyId: string, isDefault: boolean) => {
    if (isDefault) {
      setDefaultPharmacyId(pharmacyId);
      const pharmacy = pharmacies.find(p => p.id === pharmacyId);
      toast({
        title: "Default Pharmacy Set",
        description: `${pharmacy?.name} has been set as your default pharmacy.`,
      });
    } else {
      setDefaultPharmacyId(null);
    }
  };

  return (
    <PharmacyList
      pharmacies={pharmacies}
      onSelect={handleSendToPharmacy}
      onSetDefault={handleSetDefaultPharmacy}
      defaultPharmacyId={defaultPharmacyId}
    />
  );
};

export default PharmacySelectionSection;
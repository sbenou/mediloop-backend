import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import PrescriptionDetails from "./prescription/PrescriptionDetails";
import PrescriptionActions from "./prescription/PrescriptionActions";
import PharmacyList from "./prescription/PharmacyList";

interface Medication {
  name: string;
  frequency: "daily" | "weekly";
  dosesPerFrequency: "1" | "2" | "3";
  quantity: string;
}

interface PrescriptionData {
  patientName: string;
  patientAddress: string;
  doctorName: string;
  doctorAddress: string;
  medications: Medication[];
  createdAt: string;
}

const ViewPrescription = ({ data: defaultData }: { data: PrescriptionData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPharmacies, setShowPharmacies] = useState(false);
  const [defaultPharmacyId, setDefaultPharmacyId] = useState<string | null>(null);
  
  const data = location.state?.data || defaultData;

  const pharmacies = [
    {
      id: "pharmacy-1",
      name: "HealthCare Pharmacy",
      address: "123 Medical St, CA",
      distance: "0.5 miles",
      hours: "9:00 AM - 9:00 PM",
      phone: "(555) 123-4567",
      email: "contact@healthcarepharmacy.com"
    },
    {
      id: "pharmacy-2",
      name: "City Drugs",
      address: "456 Health Ave, CA",
      distance: "1.2 miles",
      hours: "8:00 AM - 10:00 PM",
      phone: "(555) 987-6543",
      email: "info@citydrugs.com"
    }
  ];

  const handleEdit = () => {
    navigate("/create-prescription", { state: { data } });
  };

  const handleDelete = () => {
    toast({
      title: "Prescription Deleted",
      description: "The prescription has been successfully deleted.",
    });
    navigate("/");
  };

  const handleSendToPharmachy = (pharmacyName: string) => {
    toast({
      title: "Prescription Sent",
      description: `The prescription has been sent to ${pharmacyName}.`,
    });
    setShowPharmacies(false);
  };

  const handleSetDefaultPharmacy = (pharmacyId: string, isDefault: boolean) => {
    if (isDefault) {
      setDefaultPharmacyId(pharmacyId);
      toast({
        title: "Default Pharmacy Set",
        description: "This pharmacy has been set as your default.",
      });
    } else {
      setDefaultPharmacyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <Button
        variant="ghost"
        onClick={() => navigate('/my-prescriptions')}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to My Prescriptions
      </Button>

      <PrescriptionDetails {...data} />

      <PrescriptionActions
        onNew={() => navigate("/create-prescription")}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSend={() => setShowPharmacies(true)}
      />

      {showPharmacies && (
        <PharmacyList
          pharmacies={pharmacies}
          onSelect={handleSendToPharmachy}
          onSetDefault={handleSetDefaultPharmacy}
          defaultPharmacyId={defaultPharmacyId}
        />
      )}
    </div>
  );
};

export default ViewPrescription;
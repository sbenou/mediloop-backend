import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PrescriptionDetails from "./prescription/PrescriptionDetails";
import PrescriptionActions from "./prescription/PrescriptionActions";
import ViewPrescriptionHeader from "./prescription/ViewPrescriptionHeader";
import PharmacySelectionSection from "./prescription/PharmacySelectionSection";
import { toast } from "@/components/ui/use-toast";

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

const ViewPrescription = ({ data: defaultData }: { data: PrescriptionData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPharmacies, setShowPharmacies] = useState(false);
  
  const data = location.state?.data || defaultData;

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <ViewPrescriptionHeader />
      <PrescriptionDetails {...data} />
      <PrescriptionActions
        onNew={() => navigate("/create-prescription")}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSend={() => setShowPharmacies(true)}
      />
      {showPharmacies && (
        <PharmacySelectionSection 
          pharmacies={pharmacies}
          onClose={() => setShowPharmacies(false)}
        />
      )}
    </div>
  );
};

export default ViewPrescription;
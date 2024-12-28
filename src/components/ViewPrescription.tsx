import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { FileEdit, FilePlus, Trash2, Send } from "lucide-react";
import PharmacyCard from "./PharmacyCard";

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

const ViewPrescription = ({ data }: { data: PrescriptionData }) => {
  const navigate = useNavigate();
  const [showPharmacies, setShowPharmacies] = useState(false);

  // Mock pharmacy data - in a real app, this would come from an API
  const pharmacies = [
    {
      name: "HealthCare Pharmacy",
      address: "123 Medical St, CA",
      distance: "0.5 miles",
      hours: "9:00 AM - 9:00 PM",
      phone: "(555) 123-4567"
    },
    {
      name: "City Drugs",
      address: "456 Health Ave, CA",
      distance: "1.2 miles",
      hours: "8:00 AM - 10:00 PM",
      phone: "(555) 987-6543"
    }
  ];

  const handleEdit = () => {
    // In a real app, you would navigate to edit route with prescription ID
    navigate("/create-prescription", { state: { data } });
  };

  const handleDelete = () => {
    // In a real app, you would call an API to delete the prescription
    toast({
      title: "Prescription Deleted",
      description: "The prescription has been successfully deleted.",
    });
    navigate("/");
  };

  const handleSendToPharmachy = (pharmacyName: string) => {
    // In a real app, you would send the prescription to the selected pharmacy
    toast({
      title: "Prescription Sent",
      description: `The prescription has been sent to ${pharmacyName}.`,
    });
    setShowPharmacies(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold text-primary">Prescription Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-primary">Patient Details</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-600 font-medium">Name:</span> {data.patientName}</p>
                <p className="text-sm"><span className="text-gray-600 font-medium">Address:</span> {data.patientAddress}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-primary">Doctor Details</h3>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-gray-600 font-medium">Name:</span> {data.doctorName}</p>
                <p className="text-sm"><span className="text-gray-600 font-medium">Address:</span> {data.doctorAddress}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-primary">Medications</h3>
            <div className="space-y-4">
              {data.medications.map((medication, index) => (
                <div key={index} className="p-4 border rounded-lg bg-accent/5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <p className="text-sm"><span className="text-gray-600 font-medium">Name:</span> {medication.name}</p>
                    <p className="text-sm"><span className="text-gray-600 font-medium">Frequency:</span> {medication.frequency}</p>
                    <p className="text-sm"><span className="text-gray-600 font-medium">Doses:</span> {medication.dosesPerFrequency} times per {medication.frequency}</p>
                    <p className="text-sm"><span className="text-gray-600 font-medium">Quantity:</span> {medication.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right text-sm text-gray-600">
            Created on: {data.createdAt}
          </div>

          <div className="flex flex-wrap gap-4 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate("/create-prescription")}
              className="gap-2"
            >
              <FilePlus className="w-4 h-4" />
              New Prescription
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="gap-2"
            >
              <FileEdit className="w-4 h-4" />
              Modify
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <Button
              onClick={() => setShowPharmacies(true)}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Send to Pharmacy
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPharmacies && (
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-xl font-semibold text-primary">Select a Pharmacy</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {pharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.name}
                {...pharmacy}
                onSelect={() => handleSendToPharmachy(pharmacy.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPrescription;
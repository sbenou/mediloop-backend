import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Prescription Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Patient Details</h3>
            <p><span className="text-gray-600">Name:</span> {data.patientName}</p>
            <p><span className="text-gray-600">Address:</span> {data.patientAddress}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Doctor Details</h3>
            <p><span className="text-gray-600">Name:</span> {data.doctorName}</p>
            <p><span className="text-gray-600">Address:</span> {data.doctorAddress}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Medications</h3>
          <div className="space-y-4">
            {data.medications.map((medication, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <p><span className="text-gray-600">Name:</span> {medication.name}</p>
                  <p><span className="text-gray-600">Frequency:</span> {medication.frequency}</p>
                  <p><span className="text-gray-600">Doses:</span> {medication.dosesPerFrequency} times per {medication.frequency}</p>
                  <p><span className="text-gray-600">Quantity:</span> {medication.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right text-sm text-gray-600">
          Created on: {data.createdAt}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewPrescription;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Medication {
  name: string;
  frequency: "daily" | "weekly";
  dosesPerFrequency: "1" | "2" | "3";
  quantity: string;
}

interface PrescriptionDetailsProps {
  patientName: string;
  patientAddress: string;
  doctorName: string;
  doctorAddress: string;
  medications: Medication[];
  createdAt: string;
}

const PrescriptionDetails = ({
  patientName,
  patientAddress,
  doctorName,
  doctorAddress,
  medications,
  createdAt,
}: PrescriptionDetailsProps) => {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-2xl font-bold text-primary">Prescription Details</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-primary">Patient Details</h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="text-gray-600 font-medium">Name:</span> {patientName}</p>
              <p className="text-sm"><span className="text-gray-600 font-medium">Address:</span> {patientAddress}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-primary">Doctor Details</h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="text-gray-600 font-medium">Name:</span> {doctorName}</p>
              <p className="text-sm"><span className="text-gray-600 font-medium">Address:</span> {doctorAddress}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-primary">Medications</h3>
          <div className="space-y-4">
            {medications.map((medication, index) => (
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
          Created on: {createdAt}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionDetails;
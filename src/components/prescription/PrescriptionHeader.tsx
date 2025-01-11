import { CardHeader, CardTitle } from "@/components/ui/card";

const PrescriptionHeader = () => {
  return (
    <CardHeader className="bg-primary/5 border-b">
      <CardTitle className="text-2xl font-bold text-primary text-center">
        Electronic Prescription
      </CardTitle>
    </CardHeader>
  );
};

export default PrescriptionHeader;
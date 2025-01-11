import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ViewPrescriptionHeader = () => {
  const navigate = useNavigate();
  
  return (
    <Button
      variant="ghost"
      onClick={() => navigate('/my-prescriptions')}
      className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to My Prescriptions
    </Button>
  );
};

export default ViewPrescriptionHeader;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PharmacyCard from "@/components/PharmacyCard";

interface DefaultPharmacyDisplayProps {
  pharmacy: any;
  onSetDefault: (id: string, isDefault: boolean) => void;
}

const DefaultPharmacyDisplay = ({ pharmacy, onSetDefault }: DefaultPharmacyDisplayProps) => {
  if (!pharmacy) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No default pharmacy selected</p>
        <Button asChild>
          <Link to="/search-pharmacy">Add a default pharmacy</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PharmacyCard
        {...pharmacy}
        onSelect={() => {}}
        onSetDefault={onSetDefault}
        isDefault={true}
      />
    </div>
  );
};

export default DefaultPharmacyDisplay;
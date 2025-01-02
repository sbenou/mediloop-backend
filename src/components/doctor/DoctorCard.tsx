import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Mail } from "lucide-react";

interface DoctorCardProps {
  id: string;
  full_name: string;
  license_number: string;
  city: string;
  email?: string;
  onConnect: (doctorId: string) => void;
}

const DoctorCard = ({ id, full_name, license_number, city, email, onConnect }: DoctorCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{full_name}</h3>
            <p className="text-sm text-gray-500">License: {license_number}</p>
            <p className="text-sm text-gray-500">{city}</p>
            {email && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {email}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect(id)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Mail, Clock } from "lucide-react";

interface DoctorCardProps {
  id: string;
  full_name: string;
  license_number: string;
  city: string;
  email?: string | null;
  hours?: string;
  onConnect: (doctorId: string) => void;
}

const DoctorCard = ({ id, full_name, license_number, city, email, hours, onConnect }: DoctorCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full">
      <CardContent className="p-4 h-full">
        <div className="flex flex-col h-full">
          <div className="space-y-2 flex-grow mb-4">
            <h3 className="font-semibold text-lg break-words">{full_name}</h3>
            <p className="text-sm text-gray-500">License: {license_number}</p>
            <p className="text-sm text-gray-500">{city}</p>
            {email && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="break-all">{email}</span>
              </p>
            )}
            {hours && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{hours}</span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect(id)}
            className="flex items-center gap-2 w-full justify-center mt-auto"
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
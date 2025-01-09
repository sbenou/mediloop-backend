import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Mail, Clock, Phone } from "lucide-react";

interface DoctorCardProps {
  id: string;
  full_name: string;
  license_number: string;
  city: string;
  email?: string | null;
  phone?: string | null;
  hours?: string;
  onConnect: () => void;
}

const DoctorCard = ({ 
  id, 
  full_name, 
  license_number, 
  city, 
  email, 
  phone,
  hours, 
  onConnect 
}: DoctorCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-lg break-words">{full_name}</h3>
          <p className="text-sm text-gray-500">License: {license_number}</p>
          <p className="text-sm text-gray-500">{city}</p>
          {email && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="break-all">{email}</span>
            </p>
          )}
          {phone && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{phone}</span>
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
          onClick={onConnect}
          className="flex items-center gap-2 w-full justify-center"
        >
          <UserPlus className="h-4 w-4" />
          Connect
        </Button>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;
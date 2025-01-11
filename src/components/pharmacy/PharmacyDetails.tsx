import { MapPin, Clock, Mail, Phone } from "lucide-react";

interface PharmacyDetailsProps {
  address: string;
  hours: string;
  email?: string;
  phone?: string;
  distance?: string;
}

const PharmacyDetails = ({
  address,
  hours,
  email,
  phone,
  distance,
}: PharmacyDetailsProps) => {
  return (
    <>
      <div className="space-y-3 mb-4">
        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{address}</span>
        </div>
        
        <div className="flex items-start space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{hours}</span>
        </div>
        
        {email && (
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{email}</span>
          </div>
        )}
        
        {phone && (
          <div className="flex items-start space-x-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {distance && (
        <p className="text-sm font-medium text-primary mb-4">{distance}</p>
      )}
    </>
  );
};

export default PharmacyDetails;
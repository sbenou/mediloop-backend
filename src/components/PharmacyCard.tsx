import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from "./FileUpload";

interface PharmacyCardProps {
  id: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
  email?: string;
  onSelect: () => void;
  onSetDefault?: (isDefault: boolean) => void;
  isDefault?: boolean;
  showUpload?: boolean;
}

const PharmacyCard = ({ 
  name, 
  address, 
  distance, 
  hours, 
  phone, 
  email,
  onSelect,
  onSetDefault,
  isDefault,
  showUpload = false
}: PharmacyCardProps) => {
  const [showPrescriptionUpload, setShowPrescriptionUpload] = React.useState(false);

  const handleFileSelect = (file: File) => {
    // Handle file upload logic here
    console.log('Selected file:', file);
  };

  return (
    <Card className="w-full p-6 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{name}</h3>
            {onSetDefault && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`default-${name}`}
                  checked={isDefault}
                  onCheckedChange={(checked) => onSetDefault(checked as boolean)}
                />
                <label
                  htmlFor={`default-${name}`}
                  className="text-sm text-muted-foreground"
                >
                  Set as default
                </label>
              </div>
            )}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{address}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">{hours}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            <span className="text-sm">{phone}</span>
          </div>
          {email && (
            <div className="flex items-center text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              <span className="text-sm">{email}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-primary">{distance}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-4">
        <Button 
          onClick={() => {
            onSelect();
            setShowPrescriptionUpload(true);
          }}
          className="w-full"
        >
          Select Pharmacy
        </Button>

        {showUpload && showPrescriptionUpload && (
          <div className="space-y-4 animate-slide-up">
            <FileUpload onFileSelect={handleFileSelect} />
            <Button 
              onClick={() => {
                // Handle send prescription logic
                console.log('Sending prescription...');
              }}
              className="w-full"
            >
              Send Prescription
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PharmacyCard;
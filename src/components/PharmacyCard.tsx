import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import FileUpload from "./FileUpload";

interface PharmacyCardProps {
  id: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
  email: string;
  onSelect: (id: string) => void;
  onSetDefault?: (id: string, isDefault: boolean) => void;
  isDefault?: boolean;
}

const PharmacyCard = ({ 
  id,
  name, 
  address, 
  distance, 
  hours, 
  phone, 
  email,
  onSelect,
  onSetDefault,
  isDefault
}: PharmacyCardProps) => {
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);

  const handleFileSelect = (file: File) => {
    console.log('Selected file:', file);
    toast({
      title: "Prescription Uploaded",
      description: `File "${file.name}" has been uploaded successfully.`,
    });
    onSelect(id);
    setShowPrescriptionUpload(false);
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
                  id={`default-${id}`}
                  checked={isDefault}
                  onCheckedChange={(checked) => {
                    if (onSetDefault) {
                      onSetDefault(id, checked as boolean);
                    }
                  }}
                />
                <label
                  htmlFor={`default-${id}`}
                  className="text-sm text-muted-foreground cursor-pointer"
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
          <div className="flex items-center text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            <span className="text-sm">{email}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-primary">{distance}</span>
        </div>
      </div>
      
      <div className="mt-4 space-y-4">
        {!showPrescriptionUpload ? (
          <Button 
            onClick={() => setShowPrescriptionUpload(true)}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Prescription
          </Button>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <FileUpload onFileSelect={handleFileSelect} />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPrescriptionUpload(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PharmacyCard;
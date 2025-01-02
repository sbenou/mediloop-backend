import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface PharmacyCardProps {
  id: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
  email?: string | null;
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
      
      <div className="mt-4">
        <Button 
          onClick={() => onSelect(id)}
          className="w-full"
        >
          Order
        </Button>
      </div>
    </Card>
  );
};

export default PharmacyCard;
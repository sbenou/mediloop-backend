import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone } from "lucide-react";

interface PharmacyCardProps {
  name: string;
  address: string;
  distance: string;
  hours: string;
  phone: string;
  onSelect: () => void;
}

const PharmacyCard = ({ name, address, distance, hours, phone, onSelect }: PharmacyCardProps) => {
  return (
    <Card className="w-full p-6 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{name}</h3>
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
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-primary">{distance}</span>
        </div>
      </div>
      <Button 
        onClick={onSelect}
        className="w-full mt-4 bg-primary hover:bg-primary/90 text-white transition-colors duration-200"
      >
        Select Pharmacy
      </Button>
    </Card>
  );
};

export default PharmacyCard;
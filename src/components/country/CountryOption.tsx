
import React from "react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ReactCountryFlag from "react-country-flag";

interface CountryOptionProps {
  code: string;
  name: string;
}

const CountryOption = ({ code, name }: CountryOptionProps) => {
  return (
    <div className="flex items-center space-x-3 border p-3 rounded-md">
      <RadioGroupItem value={code} id={code} />
      <Label htmlFor={code} className="flex items-center cursor-pointer">
        <ReactCountryFlag 
          countryCode={code} 
          svg 
          className="mr-2" 
          style={{ width: '1.5em', height: '1.5em' }}
        />
        <span>{name}</span>
      </Label>
    </div>
  );
};

export default CountryOption;

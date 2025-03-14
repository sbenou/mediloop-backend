
import React from 'react';
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// The CountryCode type needs to be imported correctly
type CountryCode = import('react-phone-number-input').Country;

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  international?: boolean;
  countryCallingCodeEditable?: boolean;
  defaultCountry?: CountryCode;
}

export function PhoneInput({ 
  value, 
  onChange, 
  placeholder = "+1 (555) 000-0000", 
  className,
  international = true,
  countryCallingCodeEditable = false,
  defaultCountry = "LU" as CountryCode
}: PhoneInputProps) {
  return (
    <div className={`rounded-md border border-input ${className}`}>
      <ReactPhoneInput
        international={international}
        countryCallingCodeEditable={countryCallingCodeEditable}
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-none"
      />
    </div>
  );
}

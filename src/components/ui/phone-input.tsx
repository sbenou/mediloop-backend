
import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder = "+1 (555) 000-0000", className }: PhoneInputProps) {
  return (
    <div className={`rounded-md border border-input ${className}`}>
      <PhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry="LU"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-none"
      />
    </div>
  );
}

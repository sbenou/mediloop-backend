
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RememberMeOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const RememberMeOption: React.FC<RememberMeOptionProps> = ({
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="rememberMe" 
        checked={checked} 
        onCheckedChange={(checked) => onChange(checked === true)}
        disabled={disabled}
      />
      <Label 
        htmlFor="rememberMe" 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Remember me
      </Label>
    </div>
  );
};

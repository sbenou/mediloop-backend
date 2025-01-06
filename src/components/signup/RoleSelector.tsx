import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UserRole } from "./SignupForm";

interface RoleSelectorProps {
  value: UserRole;
  onValueChange: (value: UserRole) => void;
}

export const RoleSelector = ({ value, onValueChange }: RoleSelectorProps) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={(value) => onValueChange(value as UserRole)}
      className="flex flex-col space-y-1 mb-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="patient" id="signup-patient" />
        <Label htmlFor="signup-patient">Patient</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="doctor" id="signup-doctor" />
        <Label htmlFor="signup-doctor">Doctor</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pharmacist" id="signup-pharmacist" />
        <Label htmlFor="signup-pharmacist">Pharmacist</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="delivery" id="signup-delivery" />
        <Label htmlFor="signup-delivery">Delivery Person</Label>
      </div>
    </RadioGroup>
  );
};
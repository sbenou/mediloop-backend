
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

export const PasswordInput = ({
  value,
  onChange,
  disabled = false,
  label = "Password",
  id = "password"
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2 text-start">
      <Label htmlFor={id} className="text-start block">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

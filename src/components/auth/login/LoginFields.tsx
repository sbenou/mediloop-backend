import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key } from "lucide-react";
import { UserRole } from "@/components/signup/SignupForm";
import { RoleSelector } from "@/components/signup/RoleSelector";

interface LoginFieldsProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  isLoading: boolean;
  selectedRole?: UserRole | null;
  onRoleChange?: (role: UserRole) => void;
}

export const LoginFields = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  isLoading,
  selectedRole,
  onRoleChange,
}: LoginFieldsProps) => {
  return (
    <div className="space-y-4">
      {selectedRole && onRoleChange && (
        <RoleSelector 
          value={selectedRole} 
          onValueChange={onRoleChange} 
          disabled={isLoading} 
        />
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="pl-8"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="pl-8"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>
    </div>
  );
};
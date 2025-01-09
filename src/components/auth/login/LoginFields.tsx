import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelector } from "@/components/signup/RoleSelector";
import { UserRole } from "@/components/signup/SignupForm";
import { PasswordResetButton } from "../PasswordResetButton";

interface LoginFieldsProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  isLoading: boolean;
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
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
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={isLoading}
          required
        />
        <div className="text-right">
          <PasswordResetButton email={email} disabled={isLoading} />
        </div>
      </div>
      <RoleSelector
        selectedRole={selectedRole}
        onRoleChange={onRoleChange}
        disabled={isLoading}
      />
    </div>
  );
};
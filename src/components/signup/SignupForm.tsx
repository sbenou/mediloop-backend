
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Key, User } from "lucide-react";
import { RoleSelector } from "./RoleSelector";
import { useSignup } from "./useSignup";

export type UserRole = "patient" | "doctor" | "pharmacist" | "delivery";

interface SignupFormProps {
  defaultRole?: UserRole;
  onRegistrationComplete?: (userId: string, role: string) => void;
}

export const SignupForm = ({ defaultRole = "patient", onRegistrationComplete }: SignupFormProps) => {
  const [userRole, setUserRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const { handleSignup, isSubmitting, rateLimitExpiresAt } = useSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSignup(email, password, name, userRole, licenseNumber, onRegistrationComplete);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RoleSelector selectedRole={userRole} onRoleChange={setUserRole} />

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Enter your full name"
            className="pl-8"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
            placeholder="Enter your email"
            type="email"
            className="pl-8"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            className="pl-8"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {(userRole === "doctor" || userRole === "pharmacist") && (
        <div className="space-y-2">
          <Label htmlFor="license">Professional License Number</Label>
          <Input
            id="license"
            placeholder="Enter your license number"
            required
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || (rateLimitExpiresAt !== null && Date.now() < rateLimitExpiresAt)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {isSubmitting ? "Please wait..." : "Sign Up"}
      </Button>
    </form>
  );
};

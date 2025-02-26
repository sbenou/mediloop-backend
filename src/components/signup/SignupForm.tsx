
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Key, User, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const { handleSignup, isSubmitting, rateLimitExpiresAt } = useSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Submitting signup form for role: ${userRole}`);
    await handleSignup(
      email, 
      password, 
      name, 
      userRole, 
      licenseNumber, 
      onRegistrationComplete
    );
  };

  const handleRoleChange = (newRole: UserRole) => {
    console.log(`Role changed to: ${newRole}`);
    setUserRole(newRole);
    
    // Reset license number when changing roles
    if (newRole !== "doctor" && newRole !== "pharmacist") {
      setLicenseNumber("");
    }
  };

  const togglePasswordVisibility = () => {
    console.log("Toggling password visibility", !showPassword);
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RoleSelector selectedRole={userRole} onRoleChange={handleRoleChange} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-left block w-full">Full Name</Label>
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
        <Label htmlFor="signup-email" className="text-left block w-full">Email</Label>
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
        <Label htmlFor="signup-password" className="text-left block w-full">Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            className="pl-8 pr-10"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {(userRole === "doctor" || userRole === "pharmacist") && (
        <div className="space-y-2">
          <Label htmlFor="license" className="text-left block w-full">Professional License Number</Label>
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

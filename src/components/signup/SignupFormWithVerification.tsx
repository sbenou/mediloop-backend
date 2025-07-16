
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Key, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { RoleSelector } from "./RoleSelector";
import { useSignup } from "./useSignup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProfessionalVerification } from "@/components/verification/ProfessionalVerification";

export type UserRole = "patient" | "doctor" | "pharmacist" | "delivery";

interface SignupFormWithVerificationProps {
  defaultRole?: UserRole;
  onRegistrationComplete?: (userId: string, role: string, verificationData?: any) => void;
}

export const SignupFormWithVerification = ({ 
  defaultRole = "patient", 
  onRegistrationComplete 
}: SignupFormWithVerificationProps) => {
  const [step, setStep] = useState<'basic' | 'verification'>('basic');
  const [userRole, setUserRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const { handleSignup, isSubmitting, rateLimitExpiresAt } = useSignup();

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    
    // If professional role, proceed to verification step
    if (userRole === 'doctor' || userRole === 'pharmacist') {
      setStep('verification');
      return;
    }

    // For non-professional roles, complete signup immediately
    try {
      await handleSignup(
        email, 
        password, 
        name, 
        userRole, 
        licenseNumber, 
        onRegistrationComplete
      );
    } catch (error) {
      if (error instanceof Error) {
        setSignupError(error.message);
      } else {
        setSignupError("An unexpected error occurred during signup.");
      }
    }
  };

  const handleVerificationComplete = async (verified: boolean, data?: any) => {
    setVerificationData(data);
    
    try {
      // Complete the signup with verification data
      await handleSignup(
        email, 
        password, 
        name, 
        userRole, 
        licenseNumber,
        (userId, role) => {
          // Pass verification data to parent
          if (onRegistrationComplete) {
            onRegistrationComplete(userId, role, {
              ...data,
              verificationStatus: verified ? 'verified' : 'pending_manual'
            });
          }
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        setSignupError(error.message);
      } else {
        setSignupError("An unexpected error occurred during signup.");
      }
    }
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
    setShowPassword(!showPassword);
  };

  if (step === 'verification') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">Professional Verification</h3>
          <p className="text-sm text-muted-foreground">
            Complete your professional verification to finish registration
          </p>
        </div>

        <ProfessionalVerification
          userRole={userRole as 'doctor' | 'pharmacist'}
          onVerificationComplete={handleVerificationComplete}
          initialData={{
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
            licenseNumber
          }}
        />

        <Button 
          variant="outline" 
          onClick={() => setStep('basic')}
          className="w-full"
        >
          Back to Basic Information
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleBasicSubmit} className="space-y-4">
      {signupError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{signupError}</AlertDescription>
        </Alert>
      )}

      {process.env.NODE_ENV === "development" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Development Mode</AlertTitle>
          <AlertDescription>
            Professional verification is simulated in development mode.
          </AlertDescription>
        </Alert>
      )}

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
          <p className="text-xs text-muted-foreground">
            This will be verified in the next step
          </p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || (rateLimitExpiresAt !== null && Date.now() < rateLimitExpiresAt)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {isSubmitting ? "Please wait..." : 
         (userRole === "doctor" || userRole === "pharmacist") ? "Continue to Verification" : "Sign Up"}
      </Button>
    </form>
  );
};

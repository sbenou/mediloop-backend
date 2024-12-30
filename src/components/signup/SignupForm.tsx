import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Key, User } from "lucide-react";
import { RoleSelector } from "./RoleSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export type UserRole = "patient" | "doctor" | "pharmacist" | "delivery";

export const SignupForm = () => {
  const [userRole, setUserRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExpiresAt, setRateLimitExpiresAt] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if rate limit is still active
    if (rateLimitExpiresAt && Date.now() < rateLimitExpiresAt) {
      const remainingMinutes = Math.ceil((rateLimitExpiresAt - Date.now()) / 60000);
      toast({
        variant: "destructive",
        title: "Rate Limit Active",
        description: `Please wait ${remainingMinutes} minute(s) before trying again.`,
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userRole,
            full_name: name,
            license_number: licenseNumber || null,
          }
        }
      });

      if (authError) {
        // Specific handling for email rate limit
        if (authError.message.includes('email rate limit') || 
            authError.code === 'over_email_send_rate_limit') {
          const rateLimitDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
          const expiresAt = Date.now() + rateLimitDuration;
          
          setRateLimitExpiresAt(expiresAt);
          setIsSubmitting(false);

          toast({
            variant: "destructive",
            title: "Email Rate Limit Reached",
            description: "Too many signup attempts. Please wait 5 minutes before requesting another verification email.",
          });
          return;
        }
        throw authError;
      }

      if (!authData.user?.id) {
        throw new Error("User creation failed");
      }

      // Create the profile using RPC
      const { error: profileError } = await supabase.rpc('create_profile', {
        user_id: authData.user.id,
        user_role: userRole,
        user_full_name: name,
        user_email: email,
        user_license_number: licenseNumber || null
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create profile. Please try again.");
      }

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account",
      });
      console.error("Signup error:", error);
    } finally {
      // Ensure isSubmitting is reset after a delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 300000); // 5 minutes cooldown
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RoleSelector value={userRole} onValueChange={setUserRole} />

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

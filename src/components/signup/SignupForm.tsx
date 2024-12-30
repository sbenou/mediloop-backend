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
      console.log("Starting signup process...");
      
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

      console.log("Auth signup response:", { authData, authError });

      if (authError) {
        if (authError.message.includes('email rate limit') || 
            authError.code === 'over_email_send_rate_limit') {
          const rateLimitDuration = 5 * 60 * 1000;
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

      console.log("Attempting to create profile for user:", authData.user.id);

      // Create the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            role: userRole,
            full_name: name,
            email: email,
            license_number: licenseNumber || null
          }
        ])
        .select()
        .single();

      console.log("Profile creation response:", { profileData, profileError });

      if (profileError) {
        // If profile already exists, this is fine - continue with success flow
        if (profileError.code === '23505') {
          console.log("Profile already exists, continuing with signup flow");
        } else {
          // For other profile creation errors, throw the error
          throw profileError;
        }
      }

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error("Detailed signup error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account",
      });
    } finally {
      setIsSubmitting(false);
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
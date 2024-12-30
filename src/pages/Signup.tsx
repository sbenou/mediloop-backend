import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail, Key, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type UserRole = "patient" | "doctor" | "pharmacist" | "delivery";

const Signup = () => {
  const [userRole, setUserRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userRole,
            full_name: name,
            license_number: licenseNumber,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('rate_limit')) {
          toast({
            variant: "destructive",
            title: "Please wait",
            description: "For security purposes, please wait a few seconds before trying again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: authError.message,
          });
        }
        return;
      }

      if (authData) {
        // Create a profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user?.id,
              role: userRole,
              full_name: name,
              email,
              license_number: licenseNumber,
            }
          ]);

        if (profileError) throw profileError;

        toast({
          title: "Account created",
          description: "Please check your email to verify your account.",
        });
        
        navigate('/login');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      // Re-enable the submit button after 7 seconds
      setTimeout(() => {
        setIsSubmitting(false);
      }, 7000);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Choose your account type and fill in your details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <RadioGroup
              defaultValue="patient"
              onValueChange={(value) => setUserRole(value as UserRole)}
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <UserPlus className="mr-2" />
              {isSubmitting ? "Please wait..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
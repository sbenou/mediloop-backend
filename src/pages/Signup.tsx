import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail, Key, User } from "lucide-react";

const Signup = () => {
  const [userType, setUserType] = useState<"user" | "pharmacy">("user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Signup logic will be implemented later with Supabase
    console.log("Signup attempt for:", userType);
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
              defaultValue="user"
              onValueChange={(value) => setUserType(value as "user" | "pharmacy")}
              className="flex flex-col space-y-1 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="signup-user" />
                <Label htmlFor="signup-user">Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pharmacy" id="signup-pharmacy" />
                <Label htmlFor="signup-pharmacy">Pharmacy</Label>
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
                />
              </div>
            </div>

            {userType === "pharmacy" && (
              <div className="space-y-2">
                <Label htmlFor="license">Pharmacy License Number</Label>
                <Input
                  id="license"
                  placeholder="Enter pharmacy license number"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              <UserPlus className="mr-2" />
              Sign Up
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
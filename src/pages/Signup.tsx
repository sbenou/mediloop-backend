
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/signup/SignupForm";
import PharmacySelection from "@/components/settings/pharmacy/PharmacySelection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Signup = () => {
  const [step, setStep] = useState<'form' | 'pharmacy'>('form');
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleRegistrationComplete = (newUserId: string, role: string) => {
    if (role === 'pharmacist') {
      setUserId(newUserId);
      setUserRole(role);
      setStep('pharmacy');
    }
  };

  const handlePharmacySelectionComplete = () => {
    // Go to home page after pharmacy selection
    window.location.href = '/';
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg origin-center transform transition-all duration-700 ease-in-out hover:shadow-xl animate-[scale-in_0.7s_ease-out] motion-reduce:transition-none motion-reduce:hover:transform-none">
        {step === 'form' ? (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
              <CardDescription>
                Choose your account type and fill in your details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupForm onRegistrationComplete={handleRegistrationComplete} />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </div>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="mr-2 p-0 h-8 w-8" 
                  onClick={() => setStep('form')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl font-bold">Select Your Pharmacy</CardTitle>
              </div>
              <CardDescription>
                As a pharmacist, please select the pharmacy you work at
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PharmacySelection 
                userId={userId || undefined}
                onComplete={handlePharmacySelectionComplete}
              />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default Signup;

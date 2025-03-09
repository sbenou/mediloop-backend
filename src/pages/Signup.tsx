
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/signup/SignupForm";
import PharmacySelection from "@/components/settings/pharmacy/PharmacySelection";
import WorkplaceSelection from "@/components/settings/workplace/WorkplaceSelection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Signup = () => {
  const [step, setStep] = useState<'form' | 'workplace'>('form');
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  // This function is called when the initial registration is complete
  const handleRegistrationComplete = (newUserId: string, role: string) => {
    console.log("Registration complete for user:", newUserId, "with role:", role);
    setUserId(newUserId);
    setUserRole(role);
    
    if (role === 'pharmacist' || role === 'doctor') {
      setStep('workplace');
    } else {
      // For other users, redirect to home
      navigate('/', { replace: true });
    }
  };

  const handleWorkplaceSelectionComplete = () => {
    // Go to home page after workplace selection
    navigate('/', { replace: true });
  };

  const getWorkplaceTitle = () => {
    if (userRole === 'pharmacist') {
      return "Select Your Pharmacy";
    } else if (userRole === 'doctor') {
      return "Select Your Workplace";
    }
    return "Select Your Workplace";
  };

  const getWorkplaceDescription = () => {
    if (userRole === 'pharmacist') {
      return "As a pharmacist, please select the pharmacy you work at";
    } else if (userRole === 'doctor') {
      return "As a doctor, please select your workplace";
    }
    return "Please select your workplace";
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
                <CardTitle className="text-2xl font-bold">{getWorkplaceTitle()}</CardTitle>
              </div>
              <CardDescription>
                {getWorkplaceDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userId && userRole && (
                <WorkplaceSelection 
                  userId={userId}
                  userRole={userRole}
                  redirectAfterSelection={true}
                  onComplete={handleWorkplaceSelectionComplete}
                />
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default Signup;

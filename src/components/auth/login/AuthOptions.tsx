import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface AuthOptionsProps {
  email: string;
  onSelectOTP: () => void;
}

export const AuthOptions = ({ email, onSelectOTP }: AuthOptionsProps) => {
  const navigate = useNavigate();

  const handleResetPassword = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Choose an Option</CardTitle>
        <CardDescription>
          Select how you would like to proceed with {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onSelectOTP}
          className="w-full"
          variant="default"
        >
          Sign in with One-Time Code
        </Button>
        <Button
          onClick={handleResetPassword}
          className="w-full"
          variant="outline"
        >
          Reset Password
        </Button>
      </CardContent>
    </Card>
  );
};
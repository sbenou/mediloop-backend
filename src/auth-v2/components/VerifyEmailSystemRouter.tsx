import React from "react";
import { useAuthToggle } from "../hooks/useAuthToggle";
import EmailConfirmationHandler from "@/components/auth/EmailConfirmationHandler";
import VerifyEmailV2 from "../pages/VerifyEmailV2";

const VerifyEmailSystemRouter: React.FC = () => {
  const { useNewAuthService } = useAuthToggle();
  return useNewAuthService ? <VerifyEmailV2 /> : <EmailConfirmationHandler />;
};

export default VerifyEmailSystemRouter;


import React from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import AccountPage from "@/components/loyalty/AccountPage";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AccountProps {
  showHeader?: boolean;
}

const Account = ({ showHeader = true }: AccountProps) => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get showHeader from location state if available, otherwise use prop
  const shouldShowHeader = location.state?.showHeader !== undefined 
    ? location.state.showHeader 
    : showHeader;

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !profile?.id) {
      navigate('/login');
    }
    
    console.log("Account page mounted");
    console.log("ShowHeader value:", shouldShowHeader);
  }, [profile, isLoading, navigate, shouldShowHeader]);

  if (isLoading || !profile?.id) {
    return null;
  }

  return (
    <UnifiedLayoutTemplate>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          <AccountPage showHeader={shouldShowHeader} />
        </ScrollArea>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Account;

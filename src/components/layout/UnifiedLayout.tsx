
import { ReactNode } from "react";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import UnifiedLayoutTemplate from "./UnifiedLayoutTemplate";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  // We're now just using UnifiedLayoutTemplate to ensure consistent layout
  return <UnifiedLayoutTemplate>{children}</UnifiedLayoutTemplate>;
};

export default UnifiedLayout;

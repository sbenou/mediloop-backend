
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";

const DoctorAdminSection: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Helper to navigate via dashboard query, as in the main sidebar
  const navigateToDoctorView = (section: string) => {
    if (location.pathname.includes('/doctor/profile')) {
      navigate(`/dashboard?view=doctor&section=${section}`);
      return;
    }
    const path = `?view=doctor&section=${section}`;
    navigate(`/dashboard${path}`);
  };

  const activeSection = searchParams.get("section");
  return (
    <SidebarSection title="ADMIN">
      <div className="mb-2" /> {/* Added consistent space between ADMIN header and Settings */}
      <SidebarItem
        icon={<Settings className="w-5 h-5 mr-3" />}
        label="Settings"
        isActive={activeSection === "settings"}
        onClick={() => navigateToDoctorView("settings")}
      />
    </SidebarSection>
  );
};

export default DoctorAdminSection;

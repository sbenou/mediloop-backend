
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, UserCog } from "lucide-react";

interface PharmacyTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const PharmacyTabs: React.FC<PharmacyTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex justify-center mb-6">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="profile" className="flex items-center justify-center">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="team" className="flex items-center justify-center">
          <Users className="mr-2 h-4 w-4" />
          Team
        </TabsTrigger>
        <TabsTrigger value="staff" className="flex items-center justify-center">
          <UserCog className="mr-2 h-4 w-4" />
          Staff Management
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default PharmacyTabs;

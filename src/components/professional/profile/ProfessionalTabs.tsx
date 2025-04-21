
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, UserCog } from "lucide-react";

interface ProfessionalTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  role: 'doctor' | 'pharmacy';
}

const ProfessionalTabs: React.FC<ProfessionalTabsProps> = ({ 
  activeTab, 
  onTabChange,
  role 
}) => {
  return (
    <div className="flex justify-center mb-6">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger 
          value="profile" 
          className="flex items-center justify-center"
          onClick={() => onTabChange('profile')}
          data-state={activeTab === 'profile' ? 'active' : 'inactive'}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger 
          value="team" 
          className="flex items-center justify-center"
          onClick={() => onTabChange('team')}
          data-state={activeTab === 'team' ? 'active' : 'inactive'}
        >
          <Users className="mr-2 h-4 w-4" />
          Team
        </TabsTrigger>
        <TabsTrigger 
          value="staff" 
          className="flex items-center justify-center"
          onClick={() => onTabChange('staff')}
          data-state={activeTab === 'staff' ? 'active' : 'inactive'}
        >
          <UserCog className="mr-2 h-4 w-4" />
          Staff Management
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default ProfessionalTabs;


import React from "react";
import { Button } from "@/components/ui/button";

interface TeleconsultationsViewProps {
  userRole: string | null;
}

const TeleconsultationsView: React.FC<TeleconsultationsViewProps> = ({ userRole }) => {
  const getViewTitle = () => {
    switch (userRole) {
      case 'patient':
        return 'Teleconsultations';
      case 'doctor':
        return 'Virtual Appointments';
      default:
        return 'Teleconsultations';
    }
  };

  const getViewDescription = () => {
    switch (userRole) {
      case 'patient':
        return 'Schedule and manage your video consultations with doctors';
      case 'doctor':
        return 'Manage your virtual appointment schedule';
      default:
        return 'Video consultation management';
    }
  };

  const getEmptyStateMessage = () => {
    switch (userRole) {
      case 'patient':
        return 'Your upcoming teleconsultations will appear here once scheduled';
      case 'doctor':
        return 'Your upcoming virtual appointments will appear here';
      default:
        return 'No teleconsultations found';
    }
  };

  const renderActionButton = () => {
    if (userRole === 'patient') {
      return (
        <Button className="mt-4">
          Find a Doctor
        </Button>
      );
    } else if (userRole === 'doctor') {
      return (
        <Button className="mt-4">
          Set Availability
        </Button>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{getViewTitle()}</h1>
      <p className="text-muted-foreground mb-8">{getViewDescription()}</p>
      
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-lg">No scheduled {userRole === 'doctor' ? 'appointments' : 'teleconsultations'}</p>
        <p className="text-muted-foreground mt-2">
          {getEmptyStateMessage()}
        </p>
        {renderActionButton()}
      </div>
    </div>
  );
};

export default TeleconsultationsView;

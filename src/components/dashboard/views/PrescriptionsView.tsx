
import React from "react";

interface PrescriptionsViewProps {
  userRole: string | null;
}

const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({ userRole }) => {
  const getViewTitle = () => {
    switch (userRole) {
      case 'patient':
        return 'My Prescriptions';
      case 'doctor':
        return 'Patient Prescriptions';
      case 'pharmacist':
        return 'Prescription Management';
      default:
        return 'Prescriptions';
    }
  };

  const getViewDescription = () => {
    switch (userRole) {
      case 'patient':
        return 'View and manage your prescriptions';
      case 'doctor':
        return 'Manage prescriptions for your patients';
      case 'pharmacist':
        return 'Process and fill patient prescriptions';
      default:
        return 'Prescription management';
    }
  };

  const getEmptyStateMessage = () => {
    switch (userRole) {
      case 'patient':
        return 'Your prescriptions will appear here once you receive them from your doctor';
      case 'doctor':
        return 'Start writing prescriptions for your patients';
      case 'pharmacist':
        return 'Prescriptions pending fulfillment will appear here';
      default:
        return 'No prescriptions found';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{getViewTitle()}</h1>
      <p className="text-muted-foreground mb-8">{getViewDescription()}</p>
      
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-lg">No active prescriptions found</p>
        <p className="text-muted-foreground mt-2">
          {getEmptyStateMessage()}
        </p>
      </div>
    </div>
  );
};

export default PrescriptionsView;

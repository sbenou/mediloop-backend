
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";

interface PharmacyViewProps {
  userRole: string | null;
}

const PharmacyView: React.FC<PharmacyViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleViewChange = (view: string, tab?: string) => {
    if (tab) {
      navigate(`/dashboard?view=${view}&${view}Tab=${tab}`);
    } else {
      navigate(`/dashboard?view=${view}`);
    }
  };
  
  const navigateToPharmacyPage = (path: string) => {
    navigate(`/pharmacy/${path}`);
  };

  // Pharmacy-specific card data
  const getPharmacyContent = () => {
    return {
      greeting: "Here's an overview of your pharmacy operations",
      cards: [
        {
          title: "Patients",
          description: "Manage patient information",
          count: 0,
          onClick: () => navigateToPharmacyPage('patients')
        },
        {
          title: "Orders",
          description: "Manage orders and payments",
          count: 0,
          onClick: () => navigateToPharmacyPage('orders')
        },
        {
          title: "Prescriptions",
          description: "View and process prescriptions",
          count: 0,
          onClick: () => navigateToPharmacyPage('prescriptions')
        },
        {
          title: "Inventory",
          description: "Manage your product inventory",
          count: 0,
          onClick: () => handleViewChange('inventory')
        }
      ]
    };
  };

  const content = getPharmacyContent();
  
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'Pharmacist'}</h1>
        <p className="text-muted-foreground">
          {content.greeting}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {content.cards.map((card, index) => (
          <Card
            key={index}
            className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={card.onClick}
          >
            <div className="text-center">
              <h3 className="text-base font-medium">{card.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
              <p className="text-4xl font-bold mt-2">{card.count}</p>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Add statistics charts */}
      <StatisticsCharts />
    </div>
  );
};

export default PharmacyView;

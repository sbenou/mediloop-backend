
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import WearableDataDisplay from "@/components/dashboard/WearableDataDisplay";
import HealthStateIndicator from "@/components/dashboard/HealthStateIndicator";

interface HomeViewProps {
  userRole: string | null;
}

const HomeView: React.FC<HomeViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleViewChange = (view: string, tab?: string) => {
    if (tab) {
      navigate(`/dashboard?view=${view}&${view}Tab=${tab}`);
    } else {
      navigate(`/dashboard?view=${view}`);
    }
  };

  // Role-specific greeting and card data
  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'patient':
        return {
          greeting: "Here's an overview of your healthcare information",
          cards: [
            {
              title: "Prescriptions",
              description: "Total active prescriptions",
              count: 0,
              onClick: () => handleViewChange('prescriptions')
            },
            {
              title: "Orders",
              description: "Total orders placed",
              count: 0,
              onClick: () => handleViewChange('orders')
            },
            {
              title: "Doctors",
              description: "Connected healthcare providers",
              count: 0,
              onClick: () => handleViewChange('profile', 'doctor')
            },
            {
              title: "Teleconsultations",
              description: "Upcoming appointments",
              count: 0,
              onClick: () => handleViewChange('teleconsultations')
            }
          ]
        };
      case 'doctor':
        return {
          greeting: "Here's an overview of your practice",
          cards: [
            {
              title: "Patients",
              description: "Total active patients",
              count: 0,
              onClick: () => handleViewChange('patients')
            },
            {
              title: "Appointments",
              description: "Scheduled appointments",
              count: 0,
              onClick: () => handleViewChange('appointments')
            },
            {
              title: "Prescriptions",
              description: "Prescriptions written",
              count: 0,
              onClick: () => handleViewChange('prescriptions')
            },
            {
              title: "Revenue",
              description: "Monthly earnings",
              count: 0,
              onClick: () => handleViewChange('billing')
            }
          ]
        };
      case 'pharmacist':
        return {
          greeting: "Here's an overview of your pharmacy operations",
          cards: [
            {
              title: "Inventory",
              description: "Products in stock",
              count: 0,
              onClick: () => handleViewChange('inventory')
            },
            {
              title: "Orders",
              description: "Pending orders",
              count: 0,
              onClick: () => handleViewChange('orders')
            },
            {
              title: "Prescriptions",
              description: "Active prescriptions",
              count: 0,
              onClick: () => handleViewChange('prescriptions')
            },
            {
              title: "Revenue",
              description: "Daily sales",
              count: 0,
              onClick: () => handleViewChange('revenue')
            }
          ]
        };
      case 'superadmin':
        return {
          greeting: "Platform administration overview",
          cards: [
            {
              title: "Users",
              description: "Registered users",
              count: 0,
              onClick: () => handleViewChange('users')
            },
            {
              title: "Pharmacies",
              description: "Active pharmacies",
              count: 0,
              onClick: () => handleViewChange('pharmacies')
            },
            {
              title: "Doctors",
              description: "Verified doctors",
              count: 0,
              onClick: () => handleViewChange('doctors')
            },
            {
              title: "Support",
              description: "Open tickets",
              count: 0,
              onClick: () => handleViewChange('support')
            }
          ]
        };
      default:
        return {
          greeting: "Welcome to your dashboard",
          cards: []
        };
    }
  };

  const content = getRoleSpecificContent();
  
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'User'}</h1>
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
      
      {/* Health State Indicators for patient and doctor roles */}
      <HealthStateIndicator userRole={userRole} />
      
      {/* Wearable Data Display for patient and doctor roles */}
      <WearableDataDisplay userRole={userRole} />
      
      {/* Add statistics charts for all roles */}
      <StatisticsCharts />
    </div>
  );
};

export default HomeView;

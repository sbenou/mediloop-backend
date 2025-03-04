
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrdersViewProps {
  activeTab: string;
  userRole: string | null;
}

const OrdersView: React.FC<OrdersViewProps> = ({ activeTab, userRole }) => {
  const navigate = useNavigate();

  // Handle tab change
  const handleTabChange = (value: string) => {
    navigate(`/dashboard?view=orders&ordersTab=${value}`);
  };

  // Get role-specific tabs configuration
  const getTabs = () => {
    switch (userRole) {
      case 'patient':
        return [
          { id: 'orders', label: 'Orders' },
          { id: 'payments', label: 'Payments' }
        ];
      case 'pharmacist':
        return [
          { id: 'pending', label: 'Pending' },
          { id: 'processing', label: 'Processing' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' }
        ];
      case 'superadmin':
        return [
          { id: 'all', label: 'All Orders' },
          { id: 'issues', label: 'Issues' },
          { id: 'analytics', label: 'Analytics' }
        ];
      default:
        return [
          { id: 'orders', label: 'Orders' }
        ];
    }
  };

  const tabs = getTabs();

  // Render empty table state based on role and tab
  const renderEmptyState = (tabId: string) => {
    let message = "No orders found.";
    
    if (userRole === 'patient' && tabId === 'payments') {
      message = "No payment records found.";
    } else if (userRole === 'pharmacist') {
      message = `No ${tabId} orders found.`;
    }
    
    return (
      <TableRow>
        <TableCell colSpan={4} className="text-center py-8">
          {message}
        </TableCell>
      </TableRow>
    );
  };

  // Get table headers based on role and tab
  const getTableHeaders = (tabId: string) => {
    if (userRole === 'patient' && tabId === 'payments') {
      return [
        "Payment ID",
        "Order ID",
        "Date",
        "Amount"
      ];
    }
    
    // Default order headers for all roles
    return [
      "Order ID",
      "Date",
      "Status",
      "Amount"
    ];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {userRole === 'patient' ? 'My Orders' : 
           userRole === 'pharmacist' ? 'Pharmacy Orders' :
           'Orders Management'}
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'patient' ? 'View and manage all your orders.' :
           userRole === 'pharmacist' ? 'Manage customer orders and deliveries.' :
           'Administrative order management across the platform.'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <div className="bg-white shadow rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getTableHeaders(tab.id).map((header, index) => (
                      <TableHead key={index} className={index === getTableHeaders(tab.id).length - 1 ? "text-right" : ""}>
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderEmptyState(tab.id)}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default OrdersView;

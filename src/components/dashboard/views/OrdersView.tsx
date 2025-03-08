
import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrdersViewProps {
  activeTab: string;
  userRole: string | null;
}

const OrdersView: React.FC<OrdersViewProps> = ({ activeTab, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Determine the current view based on location path and search params
  const getCurrentView = () => {
    if (location.pathname === '/my-orders') {
      return searchParams.get('view') || 'orders';
    }
    return searchParams.get('ordersTab') || 'orders';
  };
  
  const view = getCurrentView();

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("OrdersView: Tab changed to:", value);
    if (location.pathname === '/my-orders') {
      navigate(`/my-orders?view=${value}`);
    } else {
      navigate(`/dashboard?view=orders&ordersTab=${value}`);
    }
  };
  
  // Set correct view when navigating from sidebar
  useEffect(() => {
    // Check if we're on the orders page
    if (location.pathname === '/my-orders' || 
        (location.pathname === '/dashboard' && searchParams.get('view') === 'orders')) {
      // Get the current tab from URL or from props
      const currentTab = location.pathname === '/my-orders' 
        ? searchParams.get('view') || 'orders'
        : searchParams.get('ordersTab') || 'orders';
      
      console.log("OrdersView: Current tab from URL:", currentTab, "Active tab prop:", activeTab, "Current view:", view);
    }
  }, [location.pathname, searchParams, activeTab, view]);

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
  
  // Determine which tab should be active
  const getActiveTab = () => {
    if (location.pathname === '/my-orders') {
      return searchParams.get('view') || 'orders';
    }
    return searchParams.get('ordersTab') || tabs[0].id;
  };

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
    if (tabId === 'payments' || (userRole === 'patient' && tabId === 'payments')) {
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

  // Render the component with the correct active tab
  const currentActiveTab = getActiveTab();
  console.log("OrdersView: Current active tab:", currentActiveTab);

  return (
    <div className="space-y-6">
      {/* Orders section with tabs */}
      <Tabs defaultValue={currentActiveTab} value={currentActiveTab} onValueChange={handleTabChange}>
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

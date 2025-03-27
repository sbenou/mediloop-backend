
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
    return searchParams.get('ordersTab') || getDefaultTab();
  };
  
  // Get default tab based on user role
  const getDefaultTab = () => {
    if (userRole === 'pharmacist') {
      return 'all';
    }
    return 'orders';
  };
  
  const view = getCurrentView();

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("OrdersView: Tab changed to:", value);
    if (location.pathname === '/my-orders') {
      navigate(`/my-orders?view=${value}`);
    } else if (location.pathname === '/dashboard' && searchParams.get('view') === 'pharmacy') {
      navigate(`/dashboard?view=pharmacy&section=orders&ordersTab=${value}`);
    } else {
      navigate(`/dashboard?view=orders&ordersTab=${value}`);
    }
  };
  
  // Set correct view when navigating from sidebar
  useEffect(() => {
    if (location.pathname === '/my-orders' || 
        (location.pathname === '/dashboard' && searchParams.get('view') === 'orders')) {
      const currentTab = location.pathname === '/my-orders' 
        ? searchParams.get('view') || 'orders'
        : searchParams.get('ordersTab') || getDefaultTab();
      
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
          { id: 'all', label: 'Orders' },
          { id: 'payments', label: 'Payments' },
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
  
  // Determine which tab should be active or use the first tab as default
  const getActiveTab = () => {
    if (location.pathname === '/my-orders') {
      return searchParams.get('view') || 'orders';
    }

    // For pharmacy section in dashboard
    if (location.pathname === '/dashboard' && searchParams.get('view') === 'pharmacy') {
      return searchParams.get('ordersTab') || 'all';
    }
    
    // If pharmacist role, use the activeTab prop or default to first tab (all)
    if (userRole === 'pharmacist') {
      return activeTab || 'all';
    }
    
    return activeTab || tabs[0].id;
  };

  // Render empty table state based on role and tab
  const renderEmptyState = (tabId: string) => {
    let message = "No orders found.";
    
    if (tabId === 'payments') {
      message = "No payment records found.";
    } else if (userRole === 'pharmacist') {
      if (tabId === 'all') {
        message = "No orders found.";
      } else if (tabId !== 'payments') {
        message = `No ${tabId} orders found.`;
      }
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
    if (tabId === 'payments') {
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

  // Get view-specific header text
  const getHeaderText = () => {
    if (currentActiveTab === 'payments') {
      return "Payment Records";
    }
    return "Orders Management";
  };

  // Get view-specific description text
  const getDescriptionText = () => {
    if (currentActiveTab === 'payments') {
      return userRole === 'patient' 
        ? "View your payment history and transaction details." 
        : "Manage payment records and transaction history for your patients.";
    }
    return userRole === 'patient' 
      ? "View and track your orders and delivery status." 
      : "Manage customer orders and process them efficiently.";
  };

  // Should headers be displayed based on role and view
  const showHeader = true;

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getHeaderText()}</h1>
          <p className="text-muted-foreground">
            {getDescriptionText()}
          </p>
        </div>
      )}

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
              <h2 className="text-xl font-semibold p-4 border-b">
                {tab.id === 'payments' ? 'Payment Records' : 
                 tab.id === 'pending' ? 'Pending Orders' :
                 tab.id === 'processing' ? 'Processing Orders' :
                 tab.id === 'completed' ? 'Completed Orders' :
                 tab.id === 'cancelled' ? 'Cancelled Orders' :
                 tab.id === 'all' ? 'Orders' :
                 tab.id === 'issues' ? 'Orders with Issues' :
                 tab.id === 'analytics' ? 'Order Analytics' : 'Orders'}
              </h2>
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

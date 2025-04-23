import React, { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import OrdersHeader from "./OrdersHeader";
import OrdersTabs from "./OrdersTabs";

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
    
    if (userRole === 'doctor' && searchParams.get('section') === 'orders') {
      return searchParams.get('ordersTab') || 'orders';
    }
    
    return searchParams.get('ordersTab') || getDefaultTab();
  };
  
  // Get default tab based on user role
  const getDefaultTab = () => {
    if (userRole === 'pharmacist') {
      return 'all';
    }
    if (userRole === 'doctor') {
      return 'orders';
    }
    return 'orders';
  };
  
  const view = getCurrentView();

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log("OrdersView: Tab changed to:", value, "Current role:", userRole);
    
    // For doctor view
    if (userRole === 'doctor' && location.pathname === '/dashboard' && searchParams.get('section') === 'orders') {
      navigate(`/dashboard?section=orders&ordersTab=${value}`);
      return;
    }
    
    // For pharmacist view, we need to preserve the current subsection (all or payments)
    if (userRole === 'pharmacist' && location.pathname === '/dashboard' && searchParams.get('view') === 'pharmacy') {
      const currentSubsection = searchParams.get('ordersTab') || 'all';
      
      // Only these are valid status tabs for pharmacist
      const isStatusTab = ['pending', 'processing', 'completed', 'cancelled'].includes(value);
      
      if (isStatusTab) {
        // If it's a status tab, we maintain the current subsection (all/payments) and add a status parameter
        navigate(`/dashboard?view=pharmacy&section=orders&ordersTab=${currentSubsection}&status=${value}`);
      } else {
        // If switching between 'all' and 'payments', reset the status
        navigate(`/dashboard?view=pharmacy&section=orders&ordersTab=${value}`);
      }
    } else if (location.pathname === '/my-orders') {
      navigate(`/my-orders?view=${value}`);
    } else {
      navigate(`/dashboard?view=orders&ordersTab=${value}`);
    }
  };
  
  // Set correct view when navigating from sidebar
  useEffect(() => {
    const isOnDoctorOrdersPage = location.pathname === '/dashboard' && searchParams.get('section') === 'orders';
    const isOnPatientOrdersPage = location.pathname === '/dashboard' && searchParams.get('view') === 'orders';
    const isOnMyOrdersPage = location.pathname === '/my-orders';
    
    if (isOnDoctorOrdersPage || isOnPatientOrdersPage || isOnMyOrdersPage) {
      console.log("OrdersView: Current page type:", 
        isOnDoctorOrdersPage ? "Doctor Orders Page" : 
        isOnPatientOrdersPage ? "Patient Orders Page" : 
        "My Orders Page"
      );
      
      const currentTab = isOnMyOrdersPage 
        ? searchParams.get('view') || 'orders'
        : isOnDoctorOrdersPage
          ? searchParams.get('ordersTab') || getDefaultTab()
          : searchParams.get('ordersTab') || getDefaultTab();
      
      console.log("OrdersView: Current tab from URL:", currentTab, "Active tab prop:", activeTab, "Current view:", view, "Role:", userRole);
    }
  }, [location.pathname, searchParams, activeTab, view, userRole]);

  const getTabs = () => {
    switch (userRole) {
      case 'patient':
        return [
          { id: 'orders', label: 'Orders' },
          { id: 'payments', label: 'Payments' }
        ];
      case 'doctor':
        return [
          { id: 'orders', label: 'Orders' },
          { id: 'payments', label: 'Payments' }
        ];
      case 'pharmacist': {
        const currentSubsection = searchParams.get('ordersTab') || 'all';
        if (currentSubsection === 'all' || currentSubsection === 'payments') {
          return [
            { id: 'pending', label: 'Pending' },
            { id: 'processing', label: 'Processing' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ];
        }
        return [
          { id: 'all', label: 'Orders' },
          { id: 'payments', label: 'Payments' }
        ];
      }
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

  const renderEmptyState = (tabId: string) => {
    const currentSubsection = searchParams.get('ordersTab') || 'all';
    let message = "No orders found.";
    if (userRole === 'pharmacist') {
      if (currentSubsection === 'payments') {
        message = `No ${tabId} payments found.`;
      } else {
        message = `No ${tabId} orders found.`;
      }
    } else if (tabId === 'payments') {
      message = "No payment records found.";
    }
    return (
      <tr>
        <td colSpan={4} className="text-center py-8">
          {message}
        </td>
      </tr>
    );
  };

  // Table headers logic
  const getTableHeaders = (tabId: string) => {
    const currentSubsection = searchParams.get('ordersTab') || 'all';
    if (currentSubsection === 'payments' || tabId === 'payments') {
      return [
        "Payment ID",
        "Order ID",
        "Date",
        "Amount"
      ];
    }
    return [
      "Order ID",
      "Date",
      "Status",
      "Amount"
    ];
  };

  // Tab content title logic
  const getTabContentTitle = (tabId: string) => {
    if (userRole === 'pharmacist') {
      const currentSubsection = searchParams.get('ordersTab') || 'all';
      if (currentSubsection === 'payments') {
        return `${tabId.charAt(0).toUpperCase() + tabId.slice(1)} Payments`;
      } else {
        return `${tabId.charAt(0).toUpperCase() + tabId.slice(1)} Orders`;
      }
    }
    return tabId === 'payments' ? 'Payment Records' : 
           tabId === 'pending' ? 'Pending Orders' :
           tabId === 'processing' ? 'Processing Orders' :
           tabId === 'completed' ? 'Completed Orders' :
           tabId === 'cancelled' ? 'Cancelled Orders' :
           tabId === 'all' ? 'Orders' :
           tabId === 'issues' ? 'Orders with Issues' :
           tabId === 'analytics' ? 'Order Analytics' : 'Orders';
  };

  // Header utility
  const getHeaderText = () => {
    const currentSubsection = searchParams.get('ordersTab') || 'all';
    const currentActiveTab = getActiveTab();
    if (currentSubsection === 'payments' || currentActiveTab === 'payments') {
      return "Payment Records";
    }
    return "Orders Management";
  };

  // Description utility
  const getDescriptionText = () => {
    const currentSubsection = searchParams.get('ordersTab') || 'all';
    const currentActiveTab = getActiveTab();
    if (currentSubsection === 'payments' || currentActiveTab === 'payments') {
      return userRole === 'patient' || userRole === 'doctor'
        ? "View your payment history and transaction details."
        : "Manage payment records and transaction history for your patients.";
    }
    return userRole === 'patient' || userRole === 'doctor'
      ? "View and track your orders and delivery status."
      : "Manage customer orders and process them efficiently.";
  };

  const getActiveTab = () => {
    if (location.pathname === '/my-orders') {
      return searchParams.get('view') || 'orders';
    }

    // For doctor orders section
    if (userRole === 'doctor' && location.pathname === '/dashboard' && searchParams.get('section') === 'orders') {
      return searchParams.get('ordersTab') || 'orders';
    }

    // For pharmacy section in dashboard
    if (location.pathname === '/dashboard' && searchParams.get('view') === 'pharmacy') {
      // For pharmacist, check if we're in a status view
      if (userRole === 'pharmacist') {
        // Get status from URL if present
        return searchParams.get('status') || 'pending';
      }
      
      return searchParams.get('ordersTab') || 'all';
    }
    
    // Use the provided activeTab prop as fallback
    return activeTab || tabs[0].id;
  };

  const currentActiveTab = getActiveTab();

  return (
    <div className="space-y-6">
      <OrdersHeader
        headerText={getHeaderText()}
        descriptionText={getDescriptionText()}
      />
      <OrdersTabs
        tabs={tabs}
        activeTab={currentActiveTab}
        onTabChange={handleTabChange}
        renderEmptyState={renderEmptyState}
        getTableHeaders={getTableHeaders}
        getTabContentTitle={getTabContentTitle}
      />
    </div>
  );
};

export default OrdersView;

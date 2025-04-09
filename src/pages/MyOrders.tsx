
import React from "react";
import { useSearchParams } from "react-router-dom";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import OrdersView from "@/components/dashboard/views/OrdersView";
import { useAuth } from "@/hooks/auth/useAuth";

const MyOrders = () => {
  const [searchParams] = useSearchParams();
  const { userRole } = useAuth();
  const activeTab = searchParams.get('view') || 'orders';

  return (
    <UnifiedLayoutTemplate>
      <div className="p-6">
        <OrdersView 
          activeTab={activeTab} 
          userRole={userRole} 
        />
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default MyOrders;

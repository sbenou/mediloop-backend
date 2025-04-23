
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTable from "./OrdersTable";

interface OrdersTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (value: string) => void;
  renderEmptyState: (tabId: string) => React.ReactNode;
  getTableHeaders: (tabId: string) => string[];
  getTabContentTitle: (tabId: string) => string;
}

const OrdersTabs: React.FC<OrdersTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  renderEmptyState,
  getTableHeaders,
  getTabContentTitle,
}) => (
  <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange}>
    <TabsList>
      {tabs.map(tab => (
        <TabsTrigger key={tab.id} value={tab.id}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
    {tabs.map(tab => (
      <TabsContent key={tab.id} value={tab.id} className="mt-4">
        <OrdersTable
          tabId={getTabContentTitle(tab.id)}
          headers={getTableHeaders(tab.id)}
          emptyState={renderEmptyState(tab.id)}
        />
      </TabsContent>
    ))}
  </Tabs>
);

export default OrdersTabs;

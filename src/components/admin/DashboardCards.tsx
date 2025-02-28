
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductManagementCard } from "./tabs/ProductManagementCard";
import { PermissionsManagementCard } from "./tabs/PermissionsManagementCard";
import { CustomersCard } from "./tabs/CustomersCard";

interface DashboardCardsProps {
  onCardClick?: (value: string) => void;
}

export const DashboardCards = ({ onCardClick }: DashboardCardsProps = {}) => {
  const handleTabChange = (value: string) => {
    if (onCardClick) {
      onCardClick(value);
    }
  };

  return (
    <Tabs defaultValue="dashboard" className="w-full" onValueChange={handleTabChange}>
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <PermissionsManagementCard />
      </TabsContent>
      <TabsContent value="products">
        <ProductManagementCard />
      </TabsContent>
      <TabsContent value="customers">
        <CustomersCard />
      </TabsContent>
    </Tabs>
  );
};

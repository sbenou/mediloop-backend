
import PatientLayout from "@/components/layout/PatientLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";

const MyOrders = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  return (
    <PatientLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        
        <Tabs defaultValue={activeTab} value={activeTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-lg">No orders found</p>
              <p className="text-muted-foreground mt-2">
                Your order history will appear here once you make a purchase
              </p>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-lg">No payment records found</p>
              <p className="text-muted-foreground mt-2">
                Your payment history will appear here once you make a purchase
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
};

export default MyOrders;

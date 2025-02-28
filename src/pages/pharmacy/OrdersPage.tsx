
import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";

// Mock data - would be replaced with real data from database
const mockOrders = [
  { id: "1", patient: "John Doe", date: "2023-06-15", status: "delivered", total: 120.50 },
  { id: "2", patient: "Jane Smith", date: "2023-06-14", status: "shipped", total: 85.75 },
  { id: "3", patient: "Bob Johnson", date: "2023-06-13", status: "processing", total: 54.25 },
  { id: "4", patient: "Alice Brown", date: "2023-06-12", status: "pending", total: 32.99 },
];

const mockPayments = [
  { id: "1", patient: "John Doe", date: "2023-06-15", amount: 120.50, method: "Credit Card" },
  { id: "2", patient: "Jane Smith", date: "2023-06-14", amount: 85.75, method: "PayPal" },
  { id: "3", patient: "Bob Johnson", date: "2023-06-13", amount: 54.25, method: "Credit Card" },
  { id: "4", patient: "Alice Brown", date: "2023-06-12", amount: 32.99, method: "Bank Transfer" },
];

const OrdersPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';

  return (
    <div>
      <Header />
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Orders Management</h1>
            <p className="text-muted-foreground mt-2">View and manage all pharmacy orders</p>
          </div>
          
          <Tabs defaultValue={activeTab} value={activeTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="payments">All Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.patient}</TableCell>
                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: 
                                order.status === 'delivered' ? 'rgba(0, 200, 83, 0.1)' :
                                order.status === 'shipped' ? 'rgba(156, 39, 176, 0.1)' :
                                order.status === 'processing' ? 'rgba(33, 150, 243, 0.1)' : 
                                'rgba(255, 193, 7, 0.1)',
                              color:
                                order.status === 'delivered' ? 'rgb(0, 200, 83)' :
                                order.status === 'shipped' ? 'rgb(156, 39, 176)' :
                                order.status === 'processing' ? 'rgb(33, 150, 243)' : 
                                'rgb(255, 193, 7)'
                            }}
                          >
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayments.map((payment) => (
                      <TableRow key={payment.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">#{payment.id}</TableCell>
                        <TableCell>{payment.patient}</TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;

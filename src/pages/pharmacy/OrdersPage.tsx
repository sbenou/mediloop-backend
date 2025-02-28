
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { PrescriptionStatus } from "@/types/supabase";
import { OrderStatus } from "@/types/supabase";

// Mock data - would be replaced with real data from database
const mockOrders = [
  { id: "1", patient: "John Doe", date: "2023-06-15", status: "delivered" as OrderStatus, total: 120.50 },
  { id: "2", patient: "Jane Smith", date: "2023-06-14", status: "shipped" as OrderStatus, total: 85.75 },
  { id: "3", patient: "Bob Johnson", date: "2023-06-13", status: "processing" as OrderStatus, total: 54.25 },
  { id: "4", patient: "Alice Brown", date: "2023-06-12", status: "pending" as OrderStatus, total: 32.99 },
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

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PharmacistLayout>
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
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
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
                      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

export default OrdersPage;

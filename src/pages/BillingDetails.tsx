
import React from "react";
import PatientLayout from "@/components/layout/PatientLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useAuth } from "@/hooks/auth/useAuth";

// TEMP: Mock payment data
const paymentLogs = [
  {
    id: "1",
    product: "Monthly Subscription",
    date: "2024-04-15",
    paidBy: "john.doe@example.com",
    status: "success",
    attempts: 1
  },
  {
    id: "2",
    product: "Product A",
    date: "2024-03-10",
    paidBy: "john.doe@example.com",
    status: "failed",
    attempts: 2
  }
  // ...add more entries as needed
];

export default function BillingDetails() {
  const { profile } = useAuth();

  // Handle billing address safely
  const billingAddress = profile?.address || (profile?.city ? `City: ${profile.city}` : "No address provided"); 

  return (
    <PatientLayout hideHeader>
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold my-6">Billing Details</h2>
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
            <CardDescription>This is the billing address associated with your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="px-2 py-2 text-muted-foreground text-lg">
              {billingAddress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Review all past payments on your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Purchased Date</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payment history available.
                    </TableCell>
                  </TableRow>
                )}
                {paymentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.product}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.paidBy}</TableCell>
                    <TableCell>
                      <span className={log.status === "success" ? "text-green-600" : "text-red-600"}>
                        {log.status === "success" ? "Successful" : "Failed"}
                      </span>
                    </TableCell>
                    <TableCell>{log.attempts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}

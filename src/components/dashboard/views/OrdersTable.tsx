
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrdersTableProps {
  tabId: string;
  headers: string[];
  emptyState: React.ReactNode;
  children?: React.ReactNode;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ tabId, headers, emptyState, children }) => (
  <div className="bg-white shadow rounded-lg">
    <h2 className="text-xl font-semibold p-4 border-b">
      {tabId}
    </h2>
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index} className={index === headers.length - 1 ? "text-right" : ""}>
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {children ? children : emptyState}
      </TableBody>
    </Table>
  </div>
);

export default OrdersTable;

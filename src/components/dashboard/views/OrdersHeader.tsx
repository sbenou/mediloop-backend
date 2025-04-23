
import React from "react";

interface OrdersHeaderProps {
  headerText: string;
  descriptionText: string;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({ headerText, descriptionText }) => (
  <div>
    <h1 className="text-3xl font-bold tracking-tight">{headerText}</h1>
    <p className="text-muted-foreground">{descriptionText}</p>
  </div>
);

export default OrdersHeader;

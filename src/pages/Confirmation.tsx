
import React from 'react';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Confirmation = () => {
  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
              <p className="text-muted-foreground">
                Thank you for your order. We'll send you updates on your delivery.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p><strong>Order Number:</strong> #LUX-2024-001</p>
                <p><strong>Estimated Delivery:</strong> 2-3 business days</p>
              </div>
              
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/dashboard">View Order Status</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Confirmation;

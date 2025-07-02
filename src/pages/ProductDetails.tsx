
import React from 'react';
import { useParams } from 'react-router-dom';
import UnifiedLayoutTemplate from '@/components/layout/UnifiedLayoutTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ProductDetails = () => {
  const { id } = useParams();

  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Product Image</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Name</h1>
              <Badge variant="secondary">Available</Badge>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-primary">€29.99</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                This is a detailed description of the healthcare product. 
                It includes important information about usage, benefits, and precautions.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button className="w-full">Add to Cart</Button>
              <Button variant="outline" className="w-full">Add to Wishlist</Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>Healthcare</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span>Luxmed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span>LUX-{id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default ProductDetails;

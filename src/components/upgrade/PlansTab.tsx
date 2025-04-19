
import React from 'react';
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export function PlansTab() {
  const { addToCart } = useCart();
  
  const handleAddToCart = (plan: { name: string, price: number, features: string[] }) => {
    addToCart({
      id: `plan-${plan.name.toLowerCase()}`,
      name: `${plan.name} Plan`,
      price: plan.price,
      type: 'plan',
      interval: 'monthly',
      features: plan.features,
    });

    toast({
      title: "Added to Cart",
      description: `${plan.name} Plan added to cart`
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Plan */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Free Plan</h2>
        <div className="text-3xl font-bold mb-4">$0<span className="text-lg text-muted-foreground">/month</span></div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Basic features</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Limited consultations</span>
          </li>
          <li className="flex items-center text-muted-foreground">
            <span className="text-red-500 mr-2">✗</span>
            <span>Premium support</span>
          </li>
        </ul>
        <button className="w-full py-2 border border-primary text-primary hover:bg-primary/5 rounded-md transition-colors">
          Current Plan
        </button>
      </div>
      
      {/* Pro Plan */}
      <div className="border rounded-lg p-6 bg-primary/5 shadow-md border-primary relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white rounded-md">
          Recommended
        </div>
        <h2 className="text-xl font-semibold mb-2">Pro Plan</h2>
        <div className="text-3xl font-bold mb-4">$19.99<span className="text-lg text-muted-foreground">/month</span></div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>All basic features</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Unlimited consultations</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Premium support</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Advanced analytics</span>
          </li>
        </ul>
        <Button
          onClick={() => handleAddToCart({
            name: 'Pro',
            price: 19.99,
            features: [
              'All basic features',
              'Unlimited consultations',
              'Premium support',
              'Advanced analytics'
            ]
          })}
          className="w-full flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
      
      {/* Enterprise Plan */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
        <div className="text-3xl font-bold mb-4">$99.99<span className="text-lg text-muted-foreground">/month</span></div>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>All Pro features</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Dedicated account manager</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>Custom integrations</span>
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span>White-label options</span>
          </li>
        </ul>
        <Button
          onClick={() => handleAddToCart({
            name: 'Enterprise',
            price: 99.99,
            features: [
              'All Pro features',
              'Dedicated account manager',
              'Custom integrations',
              'White-label options'
            ]
          })}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}

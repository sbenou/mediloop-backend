import React from 'react';
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { PlanCartItem } from '@/types/cart';
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate } from "react-router-dom";

export function PlansTab() {
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [quantities, setQuantities] = React.useState<{ [key: string]: number }>({
    pro: 1,
    enterprise: 1
  });
  
  const userRole = profile?.role || 'patient';
  
  const getPremiumContent = (role: string) => {
    switch(role) {
      case 'doctor':
        return {
          title: "Upgrade to Doctor Pro",
          description: "Access advanced telemedicine features and patient analytics",
          image: "/lovable-uploads/ab37fc95-08f9-46e5-b625-5ed4085e65d0.png",
          buttonText: "Enhance Your Practice"
        };
      case 'pharmacist':
        return {
          title: "Upgrade to Pharmacy Plus",
          description: "Streamline operations with advanced inventory and prescription management",
          image: "/lovable-uploads/2e347c1d-4330-466b-b798-7c68a262f812.png",
          buttonText: "Boost Your Pharmacy"
        };
      default: // patient
        return {
          title: "Upgrade to Health Plus",
          description: "Get priority access to doctors and exclusive health services",
          image: "/lovable-uploads/27b7ec08-9cac-46b6-9641-e95a33834436.png",
          buttonText: "Upgrade Now"
        };
    }
  };
  
  const premiumContent = getPremiumContent(userRole);
  
  const handleQuantityChange = (plan: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [plan]: Math.max(1, prev[plan] + change)
    }));
  };
  
  const handleAddToCart = (plan: { name: string, price: number, features: string[] }) => {
    const quantity = quantities[plan.name.toLowerCase()];
    
    addToCart({
      id: `plan-${plan.name.toLowerCase()}`,
      name: `${plan.name} Plan`,
      price: plan.price,
      type: 'plan' as const,
      interval: 'monthly',
      features: plan.features,
      quantity
    } as PlanCartItem);

    toast({
      title: "Added to Cart",
      description: `${quantity} x ${plan.name} Plan added to cart`
    });
  };

  return (
    <div className="space-y-8">
      {/* Premium Upgrade Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 p-8 shadow-lg border-0 text-white">
        <div className="flex justify-between items-center h-full">
          <div className="flex-1 pr-6 max-w-lg">
            <h2 className="text-3xl font-bold mb-3">{premiumContent.title}</h2>
            <p className="text-blue-100 mb-6 text-lg leading-relaxed">{premiumContent.description}</p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-md"
              onClick={() => {
                toast({
                  title: "Select a plan below",
                  description: "Choose the plan that best fits your needs"
                });
              }}
            >
              {premiumContent.buttonText}
            </Button>
          </div>
          <img 
            src={premiumContent.image}
            alt="Healthcare illustration"
            className="w-64 h-64 object-contain hidden lg:block"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="border rounded-lg p-6 bg-white shadow-sm flex flex-col">
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
          <div className="mt-auto">
            <button className="w-full py-2 border border-primary text-primary hover:bg-primary/5 rounded-md transition-colors">
              Current Plan
            </button>
          </div>
        </div>
        
        {/* Pro Plan */}
        <div className="border rounded-lg p-6 bg-primary/5 shadow-md border-primary relative flex flex-col">
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
          <div className="mt-auto">
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
        </div>
        
        {/* Enterprise Plan */}
        <div className="border rounded-lg p-6 bg-white shadow-sm flex flex-col">
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
          <div className="mt-auto">
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
      </div>

      {/* Quantity Selectors - Outside and Under the Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div></div> {/* Empty space for Free plan */}
        <div className="flex items-center space-x-2">
          <span>Quantity</span>
          <div className="flex items-center w-32 h-12 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange('pro', -1)}
              disabled={quantities.pro <= 1}
              className="h-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center font-medium">
              {quantities.pro}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange('pro', 1)}
              className="h-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span>Quantity</span>
          <div className="flex items-center w-32 h-12 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange('enterprise', -1)}
              disabled={quantities.enterprise <= 1}
              className="h-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center font-medium">
              {quantities.enterprise}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleQuantityChange('enterprise', 1)}
              className="h-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

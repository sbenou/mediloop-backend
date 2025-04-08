
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

const UpgradePage = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <UnifiedLayout>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Upgrade to Pro</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 flex flex-col">
            <div className="bg-primary/10 p-4 rounded-lg mb-4 flex items-center justify-center">
              <Crown className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Basic Plan</h2>
            <p className="text-muted-foreground mb-4">Perfect for individuals</p>
            <p className="text-3xl font-bold mb-6">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6 flex-grow">
              <li className="flex items-center">✓ Basic features</li>
              <li className="flex items-center">✓ Email support</li>
              <li className="flex items-center">✓ 5GB storage</li>
            </ul>
            <Button className="w-full">Subscribe</Button>
          </Card>
          
          <Card className="p-6 border-primary flex flex-col">
            <div className="bg-primary/10 p-4 rounded-lg mb-4 flex items-center justify-center">
              <Crown className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Pro Plan</h2>
            <p className="text-muted-foreground mb-4">For professionals</p>
            <p className="text-3xl font-bold mb-6">$19.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6 flex-grow">
              <li className="flex items-center">✓ All Basic features</li>
              <li className="flex items-center">✓ Priority support</li>
              <li className="flex items-center">✓ 20GB storage</li>
              <li className="flex items-center">✓ Advanced analytics</li>
            </ul>
            <Button className="w-full">Subscribe</Button>
          </Card>
          
          <Card className="p-6 flex flex-col">
            <div className="bg-primary/10 p-4 rounded-lg mb-4 flex items-center justify-center">
              <Crown className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Enterprise</h2>
            <p className="text-muted-foreground mb-4">For large businesses</p>
            <p className="text-3xl font-bold mb-6">$49.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2 mb-6 flex-grow">
              <li className="flex items-center">✓ All Pro features</li>
              <li className="flex items-center">✓ 24/7 dedicated support</li>
              <li className="flex items-center">✓ Unlimited storage</li>
              <li className="flex items-center">✓ Custom integrations</li>
              <li className="flex items-center">✓ Team collaboration</li>
            </ul>
            <Button className="w-full">Contact Sales</Button>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default UpgradePage;

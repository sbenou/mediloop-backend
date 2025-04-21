
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Award, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";

export function SubscriptionTab() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userRole = profile?.role || 'patient';
  
  // Mock data - replace with actual subscription data from API
  const subscription = {
    active: false,
    plan: null,
    expiresAt: null
  };
  
  // Mock data for boosts - replace with actual data from API
  const boosts = {
    available: 0,
    active: 0,
    history: []
  };
  
  const isProfessional = userRole === 'doctor' || userRole === 'pharmacist';
  
  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  const handlePurchaseBoosts = () => {
    navigate('/upgrade?tab=boosts');
  };

  const handleManageBoosts = () => {
    navigate('/manage-boosts');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription.active ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{subscription.plan} Plan</h3>
                  <p className="text-muted-foreground">
                    {subscription.expiresAt ? `Expires: ${subscription.expiresAt}` : "Active"}
                  </p>
                </div>
                <Button variant="outline" onClick={handleUpgrade}>
                  Change Plan
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <Star className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">You are currently on the Free plan</h3>
                <p className="text-muted-foreground mb-4">
                  Upgrade now to access premium features with the Pro plan.
                </p>
                <Button onClick={handleUpgrade}>
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isProfessional && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Visibility Boosts
            </CardTitle>
            <CardDescription>
              {userRole === 'pharmacist' 
                ? "Boost your pharmacy's visibility in search results" 
                : "Boost your profile in doctor search results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span>Available boosts:</span>
                <span className="font-medium">{boosts.available}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span>Active boosts:</span>
                <span className="font-medium">{boosts.active}</span>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2" onClick={handleManageBoosts}>
                  Manage Boosts
                </Button>
                <Button onClick={handlePurchaseBoosts}>
                  Purchase Boosts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5" /> 
            Subscription Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 ml-5 list-disc">
            <li>Unlimited access to premium features</li>
            <li>Priority customer support</li>
            <li>Enhanced analytics and reporting</li>
            {isProfessional && (
              <>
                <li>Increased visibility in search results</li>
                <li>Advanced business tools and analytics</li>
                <li>Priority placement opportunities</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


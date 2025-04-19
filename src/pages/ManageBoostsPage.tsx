
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { useAuth } from "@/hooks/auth/useAuth";

const ManageBoostsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isProfessional = profile?.role === 'doctor' || profile?.role === 'pharmacist';

  // Mock data - replace with actual data from your backend
  const currentBoost = {
    type: "first-position",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    isActive: true
  };

  const handleExtendBoost = () => {
    // Handle extending the boost period
    // This would call your backend to process the payment and extend the boost
  };

  const handleUpgradeBoost = () => {
    navigate('/upgrade?tab=boosts');
  };

  if (!isProfessional) {
    navigate('/');
    return null;
  }

  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Manage Your Boost</h1>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Boost</CardTitle>
              <Badge variant="success">Active</Badge>
            </div>
            <CardDescription>
              Manage your current visibility boost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Type:</span>
                <span>{currentBoost.type === 'first-position' ? 'First Position Boost' : 'Top Position Boost'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Expires:</span>
                <span>{currentBoost.expiresAt.toLocaleDateString()}</span>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Extend Duration
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose extension period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1w">1 Week ($49.99)</SelectItem>
                      <SelectItem value="2w">2 Weeks ($89.99)</SelectItem>
                      <SelectItem value="1m">1 Month ($149.99)</SelectItem>
                      <SelectItem value="2m">2 Months ($279.99)</SelectItem>
                      <SelectItem value="3m">3 Months ($399.99)</SelectItem>
                      <SelectItem value="6m">6 Months ($699.99)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-4">
                  <Button onClick={handleExtendBoost} className="flex-1">
                    Extend Boost Period
                  </Button>
                  
                  {currentBoost.type === 'first-position' && (
                    <Button onClick={handleUpgradeBoost} variant="outline" className="flex-1">
                      Upgrade to Top Position
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default ManageBoostsPage;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format, formatDistance } from "date-fns";

const ManageBoostsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeBoost, setActiveBoost] = useState<any>(null);
  const [boostPrices, setBoostPrices] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  const isProfessional = profile?.role === 'doctor' || profile?.role === 'pharmacist';

  useEffect(() => {
    if (!isProfessional) {
      navigate('/');
      return;
    }

    const fetchBoostPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('boost_prices')
          .select('*')
          .order('price');
        
        if (error) throw error;
        setBoostPrices(data || []);
      } catch (err) {
        console.error('Error fetching boost prices:', err);
        toast({
          title: "Error",
          description: "Could not fetch boost prices",
          variant: "destructive"
        });
      }
    };

    const fetchActiveBoost = async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_boost', { p_user_id: profile?.id });
        
        if (error) throw error;
        setActiveBoost(data);
      } catch (err) {
        console.error('Error fetching active boost:', err);
      }
    };

    fetchBoostPrices();
    fetchActiveBoost();
  }, [isProfessional, profile?.id, navigate]);

  const handlePurchaseBoost = async (type: 'top-position' | 'first-position') => {
    if (!selectedDuration) {
      toast({
        title: "Select Duration",
        description: "Please select a boost duration",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the price for the selected duration and type
      const selectedPrice = boostPrices.find(
        price => price.boost_type === type && price.duration === selectedDuration
      );

      if (!selectedPrice) {
        throw new Error('No price found for selected boost');
      }

      const { data, error } = await supabase.rpc('purchase_boost', {
        p_user_id: profile?.id,
        p_type: type,
        p_duration: selectedDuration,
        p_price: selectedPrice.price
      });

      if (error) throw error;

      toast({
        title: "Boost Purchased",
        description: `${type === 'top-position' ? 'Top Position' : 'First Position'} boost purchased for ${selectedDuration}`
      });

      // Refresh active boost
      const { data: activeBoostData, error: activeBoostError } = await supabase.rpc(
        'get_active_boost', 
        { p_user_id: profile?.id }
      );
      
      if (activeBoostError) throw activeBoostError;
      setActiveBoost(activeBoostData);
      setSelectedDuration(null);
    } catch (err) {
      console.error('Error purchasing boost:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to purchase boost",
        variant: "destructive"
      });
    }
  };

  const handleExtendBoost = async () => {
    if (!selectedDuration || !activeBoost) {
      toast({
        title: "Select Duration",
        description: "Please select a boost duration",
        variant: "destructive"
      });
      return;
    }

    try {
      // Find the price for the selected duration and type
      const selectedPrice = boostPrices.find(
        price => price.boost_type === activeBoost.type && price.duration === selectedDuration
      );

      if (!selectedPrice) {
        throw new Error('No price found for selected boost');
      }

      const { data, error } = await supabase.rpc('extend_boost', {
        p_boost_id: activeBoost.id,
        p_duration: selectedDuration,
        p_price: selectedPrice.price
      });

      if (error) throw error;

      toast({
        title: "Boost Extended",
        description: `Boost extended for ${selectedDuration}`
      });

      // Refresh active boost
      const { data: activeBoostData, error: activeBoostError } = await supabase.rpc(
        'get_active_boost', 
        { p_user_id: profile?.id }
      );
      
      if (activeBoostError) throw activeBoostError;
      setActiveBoost(activeBoostData);
      setSelectedDuration(null);
    } catch (err) {
      console.error('Error extending boost:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to extend boost",
        variant: "destructive"
      });
    }
  };

  const boostTypes = [
    { 
      type: 'top-position', 
      title: 'Top Position Boost', 
      description: profile?.role === 'pharmacist' 
        ? "Boost your pharmacy's visibility in the top carousel" 
        : "Boost your profile in the top doctor carousel"
    },
    { 
      type: 'first-position', 
      title: 'First Position Boost', 
      description: profile?.role === 'pharmacist' 
        ? "Secure the first position in pharmacy listings" 
        : "Secure the first position in doctor listings"
    }
  ];

  if (!isProfessional) {
    return null;
  }

  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Manage Your Boost</h1>
        
        {activeBoost && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current {activeBoost.type === 'top-position' ? 'Top Position' : 'First Position'} Boost</CardTitle>
                <Badge variant={activeBoost.is_active ? "success" : "destructive"}>
                  {activeBoost.is_active ? 'Active' : 'Expired'}
                </Badge>
              </div>
              <CardDescription>
                {activeBoost.type === 'top-position' ? 'Boost your visibility in the top carousel' : 'Secure the first position in listings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Expires:</span>
                  <span>
                    {format(new Date(activeBoost.expires_at), 'PPP')} 
                    {' '}
                    ({formatDistance(new Date(activeBoost.expires_at), new Date(), { addSuffix: true })})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {boostTypes.map((boostType) => (
          <Card key={boostType.type} className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{boostType.title}</CardTitle>
                <Badge variant="success">Available</Badge>
              </div>
              <CardDescription>{boostType.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {activeBoost ? 'Extend Duration' : 'Select Duration'}
                  </label>
                  <Select 
                    value={selectedDuration || undefined} 
                    onValueChange={setSelectedDuration}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {boostPrices
                        .filter(price => price.boost_type === boostType.type)
                        .map(price => (
                          <SelectItem key={price.duration} value={price.duration}>
                            {price.duration === '1w' ? '1 Week' : 
                             price.duration === '2w' ? '2 Weeks' : 
                             price.duration === '1m' ? '1 Month' : 
                             price.duration === '2m' ? '2 Months' : 
                             price.duration === '3m' ? '3 Months' : 
                             '6 Months'} 
                            {` ($${price.price})`}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-4">
                  {activeBoost?.type === boostType.type ? (
                    <Button 
                      onClick={handleExtendBoost} 
                      className="flex-1"
                      disabled={!selectedDuration}
                    >
                      Extend Boost
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handlePurchaseBoost(boostType.type as 'top-position' | 'first-position')} 
                      className="flex-1"
                      disabled={!selectedDuration}
                    >
                      Purchase {boostType.title}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default ManageBoostsPage;

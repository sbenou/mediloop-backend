
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
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart } from "lucide-react";
import { BoostCartItem } from "@/types/cart";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const ManageBoostsInner = () => {
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

  const { addToCart } = useCart();

  const handleAddToCart = async (type: 'top-position' | 'first-position') => {
    if (!selectedDuration) {
      toast({
        title: "Select Duration",
        description: "Please select a boost duration",
        variant: "destructive"
      });
      return;
    }

    // Find the price for the selected duration and type
    const selectedPrice = boostPrices.find(
      price => price.boost_type === type && price.duration === selectedDuration
    );

    if (!selectedPrice) {
      toast({
        title: "Error",
        description: "Could not find price for selected boost",
        variant: "destructive"
      });
      return;
    }

    const boostName = type === 'top-position' ? 'Top Position Boost' : 'First Position Boost';
    const durationText = selectedDuration === '1w' ? '1 Week' : 
                        selectedDuration === '2w' ? '2 Weeks' : 
                        selectedDuration === '1m' ? '1 Month' : 
                        selectedDuration === '2m' ? '2 Months' : 
                        selectedDuration === '3m' ? '3 Months' : 
                        '6 Months';

    addToCart({
      id: `${type}-${selectedDuration}`,
      name: `${boostName} (${durationText})`,
      price: selectedPrice.price,
      type: 'boost' as const,
      boost_type: type,
      duration: selectedDuration,
    } as BoostCartItem);

    toast({
      title: "Added to Cart",
      description: `${boostName} for ${durationText} added to cart`
    });

    setSelectedDuration(null);
  };

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
                  Select Duration
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
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleAddToCart(boostType.type as 'top-position' | 'first-position')}
                  className="flex items-center gap-2"
                  disabled={!selectedDuration}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const ManageBoostsPage = () => {
  return (
    <CurrencyProvider>
      <CartProvider>
        <UnifiedLayoutTemplate>
          <ManageBoostsInner />
        </UnifiedLayoutTemplate>
      </CartProvider>
    </CurrencyProvider>
  );
};

export default ManageBoostsPage;


import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/components/ui/use-toast";
import { BoostCartItem } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export function BoostsTab() {
  const [selectedDurations, setSelectedDurations] = useState<{[key: string]: string | null}>({
    'top-position': null,
    'first-position': null
  });
  const [boostPrices, setBoostPrices] = useState<any[]>([]);
  const { profile } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
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
      }
    };

    fetchBoostPrices();
  }, []);

  const handleSelectDuration = (type: string, duration: string) => {
    setSelectedDurations(prev => ({
      ...prev,
      [type]: duration
    }));
  };

  const handleAddToCart = (type: 'top-position' | 'first-position') => {
    const selectedDuration = selectedDurations[type];
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

    // Reset the selected duration
    setSelectedDurations(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const formatDurationLabel = (duration: string) => {
    return duration === '1w' ? '1 Week' : 
           duration === '2w' ? '2 Weeks' : 
           duration === '1m' ? '1 Month' : 
           duration === '2m' ? '2 Months' : 
           duration === '3m' ? '3 Months' : 
           '6 Months';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {boostTypes.map((boostType) => (
        <Card key={boostType.type}>
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
                  value={selectedDurations[boostType.type] || undefined} 
                  onValueChange={(value) => handleSelectDuration(boostType.type, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {boostPrices
                      .filter(price => price.boost_type === boostType.type)
                      .map(price => (
                        <SelectItem key={price.duration} value={price.duration}>
                          {formatDurationLabel(price.duration)} {` ($${price.price})`}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => handleAddToCart(boostType.type as 'top-position' | 'first-position')}
                className="w-full flex items-center justify-center gap-2"
                disabled={!selectedDurations[boostType.type]}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


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
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { BoostCartItem } from "@/types/cart";

const ManageBoostsInner = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeBoost, setActiveBoost] = useState<any>(null);
  const [boostPrices, setBoostPrices] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

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
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_active_boost', { p_user_id: profile?.id });
        
        if (error) throw error;
        setActiveBoost(data);
      } catch (err) {
        console.error('Error fetching active boost:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoostPrices();
    fetchActiveBoost();
  }, [isProfessional, profile?.id, navigate]);

  const handleExtendBoost = () => {
    if (!selectedDuration || !activeBoost) {
      toast({
        title: "Select Duration",
        description: "Please select a boost duration",
        variant: "destructive"
      });
      return;
    }

    // Find the price for the selected duration and type
    const selectedPrice = boostPrices.find(
      price => price.boost_type === activeBoost.type && price.duration === selectedDuration
    );

    if (!selectedPrice) {
      toast({
        title: "Error",
        description: "Could not find price for selected boost",
        variant: "destructive"
      });
      return;
    }

    const boostName = activeBoost.type === 'top-position' ? 'Top Position Boost' : 'First Position Boost';
    const durationText = selectedDuration === '1w' ? '1 Week' : 
                      selectedDuration === '2w' ? '2 Weeks' : 
                      selectedDuration === '1m' ? '1 Month' : 
                      selectedDuration === '2m' ? '2 Months' : 
                      selectedDuration === '3m' ? '3 Months' : 
                      '6 Months';

    addToCart({
      id: `${activeBoost.type}-${selectedDuration}-extension`,
      name: `${boostName} Extension (${durationText})`,
      price: selectedPrice.price,
      type: 'boost' as const,
      boost_type: activeBoost.type,
      duration: selectedDuration,
    } as BoostCartItem);

    toast({
      title: "Added to Cart",
      description: `${boostName} extension for ${durationText} added to cart`
    });

    setSelectedDuration(null);
  };

  const handleBuyBoosts = () => {
    navigate('/upgrade?tab=boosts');
  };

  if (!isProfessional) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Your Boosts</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading your boosts...</p>
        </div>
      ) : !activeBoost ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Active Boosts</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any active boosts yet. Purchase boosts to increase your visibility.
              </p>
              <Button onClick={handleBuyBoosts}>
                Purchase Boosts
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
              
              {activeBoost.is_active && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Extend Your Boost
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
                          .filter(price => price.boost_type === activeBoost.type)
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
                  
                  <Button 
                    onClick={handleExtendBoost}
                    className="w-full flex items-center justify-center gap-2"
                    disabled={!selectedDuration}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add Extension to Cart
                  </Button>
                </div>
              )}
              
              {!activeBoost.is_active && (
                <div className="pt-4">
                  <Button 
                    onClick={handleBuyBoosts}
                    className="w-full"
                  >
                    Purchase New Boosts
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
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

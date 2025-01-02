import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
}

export const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*');
      
      // If user is not a pharmacist, only show parapharmacy products
      if (userProfile?.role !== 'pharmacist') {
        query = query.eq('type', 'parapharmacy');
      }
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!userProfile,
  });

  const addToCart = (product: Product) => {
    if (product.requires_prescription && userProfile?.role !== 'pharmacist') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "This product requires a prescription and can only be added by a pharmacist.",
      });
      return;
    }
    
    // TODO: Implement cart functionality
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div>Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="font-medium">${product.price}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToCart(product)}
                    className="flex items-center space-x-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
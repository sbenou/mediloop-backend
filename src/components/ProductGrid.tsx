import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
  image_url?: string;
  description?: string;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  userRole?: string;
}

export const ProductGrid = ({ products, isLoading, userRole }: ProductGridProps) => {
  const addToCart = (product: Product) => {
    if (product.requires_prescription && userRole !== 'pharmacist') {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "This product requires a prescription and can only be added by a pharmacist.",
      });
      return;
    }
    
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-40 bg-muted" />
            <CardContent className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id}>
          {product.image_url && (
            <div className="aspect-square relative overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {product.description && (
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
            )}
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
  );
};
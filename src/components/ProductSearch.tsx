import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ProductFilters } from "./ProductFilters";
import { ProductSort } from "./ProductSort";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
  category_id: string;
  subcategory_id: string;
  image_url?: string;
}

const ITEMS_PER_PAGE = 12;

export const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    type?: string;
    category?: string;
    subcategory?: string;
  }>({});
  const [sortBy, setSortBy] = useState("newest");
  
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

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, currentPage, filters, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });
      
      // Apply type filter based on user role
      if (userProfile?.role !== 'pharmacist') {
        query = query.eq('type', 'parapharmacy');
      } else if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      // Apply category and subcategory filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.subcategory) {
        query = query.eq('subcategory_id', filters.subcategory);
      }
      
      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'name':
          query = query.order('name');
          break;
        case 'price-asc':
          query = query.order('price');
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('popularity', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        products: data as Product[],
        total: count || 0
      };
    },
    enabled: !!userProfile,
  });

  const totalPages = Math.ceil((productsData?.total || 0) / ITEMS_PER_PAGE);

  const addToCart = (product: Product) => {
    if (product.requires_prescription && userProfile?.role !== 'pharmacist') {
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

  return (
    <div className="flex gap-6">
      <ProductFilters 
        userRole={userProfile?.role || null}
        onFilterChange={setFilters}
      />
      
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ProductSort onSortChange={setSortBy} />
        </div>

        {isLoading ? (
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
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsData?.products.map((product) => (
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

            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};
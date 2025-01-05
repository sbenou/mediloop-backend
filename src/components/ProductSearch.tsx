import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProductFilters } from "./ProductFilters";
import { ProductSort } from "./ProductSort";
import { ProductGrid } from "./ProductGrid";
import { ProductSearchBar } from "./ProductSearchBar";
import { ProductPagination } from "./ProductPagination";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { CartPreview } from "./CartPreview";
import FileUpload from "./FileUpload";
import { toast } from "./ui/use-toast";

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
  const { state: cartState } = useCart();
  
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') throw error;
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
        products: data,
        total: count || 0
      };
    },
    enabled: !!userProfile,
  });

  const handleFileUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        
        const rows = text.split('\n');
        const products = rows.slice(1).map(row => {
          const [name, price, type, requires_prescription, description] = row.split(',');
          return {
            name: name.trim(),
            price: parseFloat(price),
            type: type.trim(),
            requires_prescription: requires_prescription.trim().toLowerCase() === 'true',
            description: description?.trim(),
          };
        });

        const { error } = await supabase
          .from('products')
          .insert(products);

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to upload products: " + error.message,
          });
        } else {
          toast({
            title: "Success",
            description: `${products.length} products uploaded successfully`,
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process file",
      });
    }
  };

  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex gap-6">
      <div className="w-64 space-y-6">
        <ProductFilters 
          userRole={userProfile?.role || null}
          onFilterChange={setFilters}
        />
        {userProfile?.role === 'pharmacist' && (
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-4">Upload Products</h3>
            <FileUpload onFileSelect={handleFileUpload} />
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <ProductSearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Shopping Cart</SheetTitle>
                </SheetHeader>
                <CartPreview />
              </SheetContent>
            </Sheet>
            <ProductSort onSortChange={setSortBy} />
          </div>
        </div>

        <ProductGrid 
          products={productsData?.products || []}
          isLoading={isLoading}
          userRole={userProfile?.role}
        />

        {productsData && productsData.total > ITEMS_PER_PAGE && (
          <ProductPagination
            currentPage={currentPage}
            totalPages={Math.ceil(productsData.total / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
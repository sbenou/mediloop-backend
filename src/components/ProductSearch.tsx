import { useState } from "react";
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
import { ProductUploader } from "./product/ProductUploader";
import { useProductQuery } from "./product/ProductQueryProvider";

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

  const { data: productsData, isLoading } = useProductQuery({
    searchTerm,
    currentPage,
    filters,
    sortBy,
    itemsPerPage: ITEMS_PER_PAGE
  });

  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

  // Add console.log to debug products data
  console.log('Products Data:', productsData);

  return (
    <div className="flex gap-6">
      <div className="w-64 space-y-6">
        <ProductFilters 
          userRole={productsData?.userProfile?.role || null}
          onFilterChange={setFilters}
        />
        {productsData?.userProfile?.role === 'pharmacist' && (
          <ProductUploader />
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
          userRole={productsData?.userProfile?.role}
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
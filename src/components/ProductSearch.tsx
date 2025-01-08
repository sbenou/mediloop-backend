import { useState } from "react";
import { ProductFilters } from "./ProductFilters";
import { ProductSort } from "./ProductSort";
import { ProductGrid } from "./ProductGrid";
import { ProductSearchBar } from "./ProductSearchBar";
import { ProductPagination } from "./ProductPagination";
import { useProductQuery } from "./product/ProductQueryProvider";
import { ProductUploader } from "./product/ProductUploader";

const ITEMS_PER_PAGE = 12;

export const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    type?: string;
    category?: string;
    subcategory?: string;
    description?: string;
  }>({});
  const [sortBy, setSortBy] = useState("newest");

  const { data: productsData, isLoading } = useProductQuery({
    searchTerm,
    currentPage,
    filters,
    sortBy,
    itemsPerPage: ITEMS_PER_PAGE
  });

  const handleFilterChange = (newFilters: { type?: string; category?: string; subcategory?: string; description?: string }) => {
    console.log('Applying new filters:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="flex gap-6">
      <div className="w-64 space-y-6">
        <ProductFilters 
          userRole={productsData?.userProfile?.role || null}
          onFilterChange={handleFilterChange}
        />
        {productsData?.userProfile?.role === 'pharmacist' && (
          <ProductUploader />
        )}
      </div>
      
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <ProductSearchBar 
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1); // Reset to first page when search changes
            }}
          />
          <ProductSort onSortChange={(value) => {
            setSortBy(value);
            setCurrentPage(1); // Reset to first page when sort changes
          }} />
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
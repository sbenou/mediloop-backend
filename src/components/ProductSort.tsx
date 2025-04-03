
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const ProductSort = ({ 
  onSortChange 
}: { 
  onSortChange: (value: string) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const currentSort = queryParams.get('sort') || 'newest';

  // Clear product navigation cache when visiting the products list
  useEffect(() => {
    if (location.pathname === '/products') {
      // Clear both the adjacent products cache and the ordered product IDs
      const navigationCacheKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('adjacent-products-'));
      
      navigationCacheKeys.forEach(key => sessionStorage.removeItem(key));
      sessionStorage.removeItem('ordered-product-ids');
    }
  }, [location.pathname]);

  const handleSortChange = (value: string) => {
    // Update URL with new sort parameter
    queryParams.set('sort', value);
    navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
    
    // Clear navigation cache when changing sort
    const navigationCacheKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('adjacent-products-'));
    
    navigationCacheKeys.forEach(key => sessionStorage.removeItem(key));
    
    // Also clear the ordered product IDs
    sessionStorage.removeItem('ordered-product-ids');
    
    // Notify parent component
    onSortChange(value);
  };

  return (
    <Select onValueChange={handleSortChange} defaultValue={currentSort} value={currentSort}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest First</SelectItem>
        <SelectItem value="name">Name (A-Z)</SelectItem>
        <SelectItem value="price-asc">Price: Low to High</SelectItem>
        <SelectItem value="price-desc">Price: High to Low</SelectItem>
        <SelectItem value="popular">Most Popular</SelectItem>
      </SelectContent>
    </Select>
  );
};

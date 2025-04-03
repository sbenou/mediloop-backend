
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchProduct, fetchAdjacentProducts, Product, AdjacentProduct } from '@/services/product-service';

export const useProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [prevProduct, setPrevProduct] = useState<AdjacentProduct | null>(null);
  const [nextProduct, setNextProduct] = useState<AdjacentProduct | null>(null);
  const [loadingNavigation, setLoadingNavigation] = useState(false);

  // Parse sort order from query params
  const queryParams = new URLSearchParams(location.search);
  const sortOrder = queryParams.get('sort') || 'newest';

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        console.log('Fetching product with ID:', id);
        
        const productData = await fetchProduct(id);
        setProduct(productData);
        
        // Set up gallery images
        const images = [];
        if (productData.image_url) {
          images.push(productData.image_url);
        }
        
        // Add placeholder images to simulate a gallery
        const placeholders = [
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
          'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
          'https://images.unsplash.com/photo-1577401132921-cb39bb0adcff?w=600&q=80'
        ];
        
        // Only add placeholders if there's no main image or to supplement it
        if (!productData.image_url) {
          images.push(...placeholders);
        } else {
          // Add a couple of placeholders to simulate additional product views
          images.push(...placeholders.slice(0, 2));
        }
        
        setGalleryImages(images);
        
        // Load adjacent products
        try {
          const { prevProduct, nextProduct } = await fetchAdjacentProducts(id, sortOrder);
          setPrevProduct(prevProduct);
          setNextProduct(nextProduct);
          console.log("Adjacent products loaded:", { prevProduct, nextProduct });
        } catch (adjError) {
          console.error("Error loading adjacent products:", adjError);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, sortOrder]);

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const navigateToAdjacentProduct = (adjacentProduct: AdjacentProduct | null) => {
    if (!adjacentProduct) return;
    
    console.log(`Navigating to product: ${adjacentProduct.id} (${adjacentProduct.name})`);
    
    // Set loading states to show loading UI
    setLoadingNavigation(true);
    setLoading(true);
    
    // Preserve the current sort order in the URL
    navigate(`/products/${adjacentProduct.id}?sort=${sortOrder}`);
  };

  return {
    product,
    loading,
    error,
    quantity,
    galleryImages,
    prevProduct,
    nextProduct,
    loadingNavigation,
    sortOrder,
    handleQuantityChange,
    navigateToAdjacentProduct
  };
};

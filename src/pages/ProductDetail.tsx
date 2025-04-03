
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string | null;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
}

interface AdjacentProduct {
  id: string;
  name: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevProduct, setPrevProduct] = useState<AdjacentProduct | null>(null);
  const [nextProduct, setNextProduct] = useState<AdjacentProduct | null>(null);
  const [loadingNavigation, setLoadingNavigation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { formatCurrency, convertPrice } = useCurrency();

  // Parse sort order from query params
  const queryParams = new URLSearchParams(location.search);
  const sortOrder = queryParams.get('sort') || 'newest';

  // Sample gallery images (in a real app, these would come from the database)
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        console.log('Fetching product with ID:', id);
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        if (data) {
          console.log('Product data:', data);
          
          // Type assertion to ensure the type is either 'medication' or 'parapharmacy'
          const validType = data.type === 'medication' || data.type === 'parapharmacy' 
            ? data.type as 'medication' | 'parapharmacy'
            : 'parapharmacy'; // Default fallback
          
          // Create a valid product object with correct typing
          const productData: Product = {
            id: data.id,
            name: data.name,
            price: data.price,
            description: data.description || undefined,
            image_url: data.image_url,
            requires_prescription: !!data.requires_prescription,
            type: validType
          };
          
          setProduct(productData);
          
          // Set the main product image as the first gallery image
          const images = [];
          if (data.image_url) {
            images.push(data.image_url);
            setActiveImage(data.image_url);
          }
          
          // Add placeholder images to simulate a gallery
          // In a real app, you would fetch related images from the database
          const placeholders = [
            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
            'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
            'https://images.unsplash.com/photo-1577401132921-cb39bb0adcff?w=600&q=80'
          ];
          
          // Only add placeholders if there's no main image or to supplement it
          if (!data.image_url) {
            setActiveImage(placeholders[0]);
            images.push(...placeholders);
          } else {
            // Add a couple of placeholders to simulate additional product views
            images.push(...placeholders.slice(0, 2));
          }
          
          setGalleryImages(images);
          
          // Fetch next and previous products
          fetchAdjacentProducts(data.id);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, sortOrder]);

  const fetchAdjacentProducts = async (currentProductId: string) => {
    setLoadingNavigation(true);
    try {
      let orderField = 'created_at';
      let ascending = false;
      
      // Determine order field and direction based on sort order
      switch (sortOrder) {
        case 'name':
          orderField = 'name';
          ascending = true;
          break;
        case 'price-asc':
          orderField = 'price';
          ascending = true;
          break;
        case 'price-desc':
          orderField = 'price';
          ascending = false;
          break;
        case 'popular':
          orderField = 'popularity';
          ascending = false;
          break;
        default: // newest
          orderField = 'created_at';
          ascending = false;
      }
      
      // Get current product values for comparison
      const { data: currentProduct } = await supabase
        .from('products')
        .select(orderField)
        .eq('id', currentProductId)
        .single();
        
      if (!currentProduct) {
        console.error('Could not find current product value for comparison');
        return;
      }
      
      const compareValue = currentProduct[orderField as keyof typeof currentProduct];
      
      // Fetch previous product with name
      const { data: prevData } = await supabase
        .from('products')
        .select('id, name')
        .filter(orderField, ascending ? 'lt' : 'gt', compareValue)
        .order(orderField, { ascending: !ascending })
        .limit(1);
      
      // Fetch next product with name
      const { data: nextData } = await supabase
        .from('products')
        .select('id, name')
        .filter(orderField, ascending ? 'gt' : 'lt', compareValue)
        .order(orderField, { ascending: ascending })
        .limit(1);
      
      setPrevProduct(prevData && prevData.length > 0 ? prevData[0] : null);
      setNextProduct(nextData && nextData.length > 0 ? nextData[0] : null);
    } catch (err) {
      console.error('Error fetching adjacent products:', err);
    } finally {
      setLoadingNavigation(false);
    }
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.requires_prescription) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "This product requires a prescription and cannot be added to cart.",
      });
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || undefined,
      quantity
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const navigateToProduct = (productData: AdjacentProduct | null) => {
    if (!productData) return;
    // Preserve the current sort order in the URL
    navigate(`/products/${productData.id}?sort=${sortOrder}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error || 'Product not found'}</p>
        <Button className="mt-4" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2" 
        onClick={() => navigate('/products')}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
            <img
              src={activeImage || '/placeholder.svg'}
              alt={product?.name || 'Product image'}
              className="h-full w-full object-contain"
            />
          </div>
          
          {/* Image Gallery */}
          <Carousel className="w-full group">
            <CarouselContent>
              {galleryImages.map((image, index) => (
                <CarouselItem key={index} className="basis-1/4 sm:basis-1/5">
                  <div 
                    className={`h-20 w-full rounded-md overflow-hidden cursor-pointer border-2 
                      ${activeImage === image ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setActiveImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${product?.name || 'Product'} view ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
          
          {/* Product Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigateToProduct(prevProduct)}
              disabled={!prevProduct || loadingNavigation}
            >
              <ArrowLeft className="h-4 w-4" /> {prevProduct ? prevProduct.name : 'Previous Product'}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigateToProduct(nextProduct)}
              disabled={!nextProduct || loadingNavigation}
            >
              {nextProduct ? nextProduct.name : 'Next Product'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold mt-2 text-primary">
              {formatCurrency(convertPrice(product.price))}
            </p>
          </div>

          {product.description && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-3">Quantity</h2>
            <div className="flex items-center w-32 h-12 border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-full"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-medium">
                {quantity}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full flex items-center gap-2" 
              size="lg"
              onClick={handleAddToCart}
              disabled={product.requires_prescription}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2" 
              size="lg"
              onClick={handleBuyNow}
              disabled={product.requires_prescription}
            >
              <ShoppingBag className="h-5 w-5" />
              Buy Now
            </Button>
            
            {product.requires_prescription && (
              <p className="text-sm text-red-500 mt-2">
                This product requires a prescription and cannot be purchased directly.
              </p>
            )}
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-lg font-semibold mb-2">Details</h2>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-gray-500 min-w-32">Type:</span>
                <span className="capitalize">{product.type}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-gray-500 min-w-32">Prescription Required:</span>
                <span>{product.requires_prescription ? 'Yes' : 'No'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

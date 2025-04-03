
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductNavigation } from '@/components/product/ProductNavigation';
import { ProductQuantitySelector } from '@/components/product/ProductQuantitySelector';
import { ProductDetails } from '@/components/product/ProductDetails';
import { ProductActions } from '@/components/product/ProductActions';
import { useProductDetail } from '@/hooks/useProductDetail';

const ProductDetail = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatCurrency, convertPrice } = useCurrency();
  
  const {
    product,
    loading,
    error,
    quantity,
    galleryImages,
    prevProduct,
    nextProduct,
    loadingNavigation,
    handleQuantityChange,
    navigateToAdjacentProduct
  } = useProductDetail();

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
      {/* Breadcrumb navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images and Navigation */}
        <div className="space-y-4">
          <ProductImageGallery 
            mainImage={product.image_url} 
            galleryImages={galleryImages} 
            productName={product.name} 
          />
          
          <ProductNavigation 
            prevProduct={prevProduct} 
            nextProduct={nextProduct}
            onNavigate={navigateToAdjacentProduct}
            loading={loadingNavigation}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold mt-2 text-primary">
              {formatCurrency(convertPrice(product.price))}
            </p>
          </div>

          <ProductQuantitySelector 
            quantity={quantity} 
            onQuantityChange={handleQuantityChange} 
          />

          <ProductActions 
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            disabled={product.requires_prescription}
          />

          <ProductDetails product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

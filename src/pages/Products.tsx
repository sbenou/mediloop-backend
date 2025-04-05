
import { ProductSearch } from '@/components/ProductSearch';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CountrySelector from '@/components/CountrySelector';
import { Outlet } from 'react-router-dom';

const Products = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CountrySelector />
      <div className="container mx-auto py-8 flex-grow">
        <ProductSearch />
      </div>
      <Footer />
    </div>
  );
};

export default Products;

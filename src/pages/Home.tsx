
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Pharmacy Finder</h1>
          <p className="text-xl mb-8">Find pharmacies near you and manage your prescriptions easily.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/search-pharmacy-test')} 
              size="lg" 
              className="px-8"
            >
              Find a Pharmacy
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;

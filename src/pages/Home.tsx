
import React, { useEffect } from 'react';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';

const Home = () => {
  useEffect(() => {
    console.log("Home component mounted - simplified version");
    document.title = "Home - MediLoop";
  }, []);

  console.log("Rendering simplified Home component");
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Debug element - highly visible */}
      <div className="fixed top-20 left-0 right-0 bg-red-500 text-white p-4 z-[9999] text-center font-bold text-xl">
        HOME COMPONENT RENDERED
      </div>
      
      <UnifiedHeader />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to MediLoop</h1>
          <p className="text-xl">Your healthcare platform</p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;

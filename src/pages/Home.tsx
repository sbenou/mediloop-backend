
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
    <div className="min-h-screen flex flex-col bg-white relative">
      {/* Debug element with extremely high z-index that should be visible above all other content */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 999999 }}>
        <div className="bg-red-600 text-white p-6 rounded-lg font-bold text-3xl shadow-2xl pointer-events-auto border-4 border-yellow-400">
          HOME COMPONENT CONTENT IS RENDERING
        </div>
      </div>
      
      {/* High-visibility border around the entire content area */}
      <div className="fixed inset-0 border-8 border-purple-500" style={{ zIndex: 99999 }}></div>
      
      <UnifiedHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-4xl mx-auto bg-blue-100 p-10 rounded-lg shadow-lg border-2 border-blue-500">
          <h1 className="text-4xl font-bold mb-6 text-center">Welcome to MediLoop</h1>
          <p className="text-xl text-center mb-8">Your healthcare platform</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4">Find a Doctor</h2>
              <p className="mb-4">Connect with qualified physicians near you.</p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Search Doctors
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4">Find a Pharmacy</h2>
              <p className="mb-4">Locate pharmacies and order medications.</p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded">
                Search Pharmacies
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;

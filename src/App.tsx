
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/components/layout/Header';
import ProductsPage from '@/pages/ProductsPage';
import NotificationTestPanel from '@/components/testing/NotificationTestPanel';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        <AuthGuard>
          <Header />
          <main className="container mx-auto py-6">
            <Routes>
              <Route path="/" element={<ProductsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/test-notifications" element={<NotificationTestPanel />} />
            </Routes>
          </main>
        </AuthGuard>
      </div>
    </Router>
  );
}

export default App;

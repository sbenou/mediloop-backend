
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import SearchPharmacy from './pages/SearchPharmacy';
import SearchDoctors from './pages/SearchDoctors';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import DatabaseTest from "@/pages/DatabaseTest";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pharmacies" element={<SearchPharmacy />} />
      <Route path="/doctors" element={<SearchDoctors />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
      
      {/* Test route for database connectivity */}
      <Route path="/database-test" element={<DatabaseTest />} />
    </Routes>
  );
};

export default AppRoutes;

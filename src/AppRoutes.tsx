import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Pharmacies from './pages/Pharmacies';
import PharmacyDetailsPage from './pages/PharmacyDetailsPage';
import Doctors from './pages/Doctors';
import DoctorDetailsPage from './pages/DoctorDetailsPage';
import Contact from './pages/Contact';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Logout from './pages/Logout';
import Pricing from './pages/Pricing';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import MedicationRequest from './pages/MedicationRequest';
import BecomePartner from './pages/BecomePartner';
import Loyalty from './pages/Loyalty';
import PasswordReset from './pages/PasswordReset';
import MagicLink from './pages/MagicLink';
import DatabaseTest from "@/pages/DatabaseTest";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pharmacies" element={<Pharmacies />} />
      <Route path="/pharmacies/:id" element={<PharmacyDetailsPage />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetailsPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/cancel" element={<CheckoutCancel />} />
      <Route path="/medication-request" element={<MedicationRequest />} />
      <Route path="/become-partner" element={<BecomePartner />} />
      <Route path="/loyalty" element={<Loyalty />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/magic-link" element={<MagicLink />} />
      <Route path="*" element={<NotFound />} />
      
      {/* Test route for database connectivity */}
      <Route path="/database-test" element={<DatabaseTest />} />
    </Routes>
  );
};

export default AppRoutes;

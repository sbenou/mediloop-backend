
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Contact from "@/components/layout/Footer"; // Temporarily using Footer as Contact page
import About from "@/components/layout/Footer"; // Temporarily using Footer as About page
import Unauthorized from "@/pages/UnauthorizedPage"; // Updated import path
import NotFound from "./pages/NotFound";
import DoctorDetails from "@/pages/doctor/DoctorProfilePage"; // Using existing doctor profile page
import UpgradePage from "./pages/upgrade/UpgradePage";
import Account from "./pages/Account";
import ManageBoostsPage from "./pages/ManageBoostsPage";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import ProtectedReferral from "@/router/roles/ProtectedReferral";
import Referral from "@/pages/Referral";

// Create a simple placeholder component for missing pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="container mx-auto p-8">
    <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
    <p>This page is under development.</p>
  </div>
);

// Create placeholder components for missing pages
const Register = () => <PlaceholderPage title="Register" />;
const EditProfile = () => <PlaceholderPage title="Edit Profile" />;
const Appointments = () => <PlaceholderPage title="Appointments" />;
const Doctors = () => <PlaceholderPage title="Doctors" />;

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes that don't require authentication */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />

      <Route path="*" element={<NotFound />} />

      {/* Protected routes - these require authentication */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="/edit-profile" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
          <EditProfile />
        </ProtectedRoute>
      } />
      
      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor']}>
          <Appointments />
        </ProtectedRoute>
      } />
      
      <Route path="/upgrade" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
          <UpgradePage />
        </ProtectedRoute>
      } />
      
      <Route path="/account" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
          <Account />
        </ProtectedRoute>
      } />
      
      <Route path="/manage-boosts" element={
        <ProtectedRoute allowedRoles={['doctor', 'pharmacist']}>
          <ManageBoostsPage />
        </ProtectedRoute>
      } />

      <Route path="/referral" element={
        <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
          <Referral />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

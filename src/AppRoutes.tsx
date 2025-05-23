import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
import TestDataLoader from "@/components/testing/TestDataLoader";
import FindDoctor from "@/pages/FindDoctor";
import Dashboard from "@/pages/Dashboard";
import PharmacyDashboard from "@/pages/pharmacy/PharmacyDashboard";
import ProtectedBillingDetails from "@/router/roles/ProtectedBillingDetails";
import ProtectedPharmacyProfilePage from "@/router/roles/ProtectedPharmacyProfilePage";
import ProtectedPharmacyPatientsPage from "@/router/roles/ProtectedPharmacyPatientsPage";
import Billing from "@/pages/Billing";
import SearchPharmacy from "@/pages/SearchPharmacy";
import FindPharmacy from "@/pages/FindPharmacy"; 
import Products from "@/pages/Products";
import ProtectedActivities from "@/router/roles/ProtectedActivities";
import ProtectedDoctorProfilePage from "@/router/roles/ProtectedDoctorProfilePage";

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

export default function AppRoutes() {
  console.log("AppRoutes component rendered");
  
  return (
    <TestDataLoader>
      <Routes>
        {/* Public routes that don't require authentication */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> {/* Added Signup route */}
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Products route */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:pharmacyId" element={<Products />} />
        
        {/* Doctor and pharmacy routes - accessible to all users */}
        <Route path="/doctors" element={<FindDoctor />} />
        <Route path="/find-doctor" element={<FindDoctor />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/search-pharmacy" element={<SearchPharmacy />} />
        <Route path="/pharmacies" element={<SearchPharmacy />} />
        <Route path="/find-pharmacy" element={<SearchPharmacy />} />
        
        {/* Dashboard routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Activities routes */}
        <Route path="/activities" element={
          <ProtectedActivities initialView="activities" />
        } />
        <Route path="/notifications" element={
          <ProtectedActivities initialView="notifications" />
        } />
        
        {/* Add Billing Details route for all authenticated users */}
        <Route path="/billing-details" element={<ProtectedBillingDetails />} />
        <Route path="/billing" element={<Billing />} />
        
        {/* Doctor specific routes */}
        <Route path="/doctor/profile" element={<ProtectedDoctorProfilePage />} />
        <Route path="/doctor/dashboard" element={<Dashboard />} />
        
        {/* Pharmacy specific routes - need to be protected */}
        <Route path="/pharmacy/dashboard" element={
          <ProtectedRoute allowedRoles={['pharmacist', 'superadmin']}>
            <PharmacyDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/pharmacy/profile" element={
          <ProtectedRoute allowedRoles={['pharmacist', 'superadmin']}>
            <ProtectedPharmacyProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/pharmacy/patients" element={
          <ProtectedRoute allowedRoles={['pharmacist', 'superadmin']}>
            <ProtectedPharmacyPatientsPage />
          </ProtectedRoute>
        } />

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
    </TestDataLoader>
  );
}

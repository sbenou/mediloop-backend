import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import AuthSystemRouter from "./auth-v2/components/AuthSystemRouter";
import Profile from "./pages/Profile";
// import Pharmacies from './pages/Pharmacies';
// import PharmacyDetailsPage from './pages/PharmacyDetailsPage';
// import Doctors from './pages/Doctors';
// import DoctorDetailsPage from './pages/DoctorDetailsPage';
// import Contact from './pages/Contact';
// import About from './pages/About';
// import Terms from './pages/Terms';
// import Privacy from './pages/Privacy';
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
// import Logout from './pages/Logout';
// import Pricing from './pages/Pricing';
// import CheckoutSuccess from './pages/CheckoutSuccess';
// import CheckoutCancel from './pages/CheckoutCancel';
// import MedicationRequest from './pages/MedicationRequest';
import BecomePartner from "./pages/BecomePartner";
// import Loyalty from './pages/Loyalty';
import ResetPassword from "./pages/ResetPassword";
// import MagicLink from './pages/MagicLink';
import DatabaseTest from "@/pages/DatabaseTest";
import DenoBackendManagement from "@/pages/DenoBackendManagement";
import AdminSettings from "@/pages/AdminSettings";
import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import TenantManagement from "@/pages/superadmin/TenantManagement";
import LegacyClinicalReviewPage from "@/pages/superadmin/LegacyClinicalReviewPage";
import RotationQueuePage from "@/pages/superadmin/RotationQueuePage";
import ProtectedDoctorDashboard from "@/router/roles/ProtectedDoctorDashboard";
import ProtectedDoctorProfilePage from "@/router/roles/ProtectedDoctorProfilePage";
import ProtectedPharmacyDashboard from "@/router/roles/ProtectedPharmacyDashboard";
import Notifications from "@/pages/Notifications";
import ProtectedReferral from "@/router/roles/ProtectedReferral";
import ProtectedBillingDetails from "@/router/roles/ProtectedBillingDetails";
import ProtectedUpgradePage from "@/router/roles/ProtectedUpgradePage";
import Account from "@/pages/Account";
import AcceptInvite from "@/pages/AcceptInvite";
import VerifyEmailSystemRouter from "@/auth-v2/components/VerifyEmailSystemRouter";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import CreatePrescription from "@/pages/CreatePrescription";
import EditPrescription from "@/pages/EditPrescription";
import PrescriptionDetail from "@/pages/PrescriptionDetail";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/login" element={<AuthSystemRouter type="login" />} />
      <Route path="/signup" element={<AuthSystemRouter type="signup" />} />
      <Route path="/verify-email" element={<VerifyEmailSystemRouter />} />
      <Route path="/profile" element={<Profile />} />
      {/* <Route path="/pharmacies" element={<Pharmacies />} /> */}
      {/* <Route path="/pharmacies/:id" element={<PharmacyDetailsPage />} /> */}
      {/* <Route path="/doctors" element={<Doctors />} /> */}
      {/* <Route path="/doctors/:id" element={<DoctorDetailsPage />} /> */}
      {/* <Route path="/contact" element={<Contact />} /> */}
      {/* <Route path="/about" element={<About />} /> */}
      {/* <Route path="/terms" element={<Terms />} /> */}
      {/* <Route path="/privacy" element={<Privacy />} /> */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      {/* <Route path="/logout" element={<Logout />} /> */}
      {/* <Route path="/pricing" element={<Pricing />} /> */}
      {/* <Route path="/checkout/success" element={<CheckoutSuccess />} /> */}
      {/* <Route path="/checkout/cancel" element={<CheckoutCancel />} /> */}
      {/* <Route path="/medication-request" element={<MedicationRequest />} /> */}
      <Route path="/become-partner" element={<BecomePartner />} />
      {/* <Route path="/loyalty" element={<Loyalty />} /> */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password/new" element={<ResetPassword />} />
      {/* <Route path="/magic-link" element={<MagicLink />} /> */}

      {/* Test route for database connectivity */}
      <Route path="/database-test" element={<DatabaseTest />} />

      {/* Deno Backend Management */}
      <Route path="/deno-backend" element={<DenoBackendManagement />} />

      {/* Admin Routes */}
      <Route path="/admin-settings" element={<AdminSettings />} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedDoctorDashboard />} />
      <Route path="/doctor/profile" element={<ProtectedDoctorProfilePage />} />
      <Route path="/pharmacy/dashboard" element={<ProtectedPharmacyDashboard />} />
      <Route
        path="/create-prescription"
        element={
          <ProtectedRoute allowedRoles={["doctor", "superadmin"]}>
            <CreatePrescription />
          </ProtectedRoute>
        }
      />
      <Route path="/edit-prescription/:id" element={<EditPrescription />} />
      <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />

      {/* Additional Routes */}
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/referral" element={<ProtectedReferral />} />
      <Route path="/account" element={<Account />} />
      <Route path="/billing-details" element={<ProtectedBillingDetails />} />
      <Route path="/upgrade" element={<ProtectedUpgradePage />} />

      {/* Super Admin Routes */}
      <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/superadmin/tenants" element={<TenantManagement />} />
      <Route path="/superadmin/legacy-clinical" element={<LegacyClinicalReviewPage />} />
      <Route path="/superadmin/rotation-queue" element={<RotationQueuePage />} />

      {/* 404 Route - Must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

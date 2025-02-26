
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AuthProvider } from './providers/AuthProvider';

// Lazy load pages
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Products = lazy(() => import('./pages/Products'));
const SearchPharmacy = lazy(() => import('./pages/SearchPharmacy'));
const FindDoctor = lazy(() => import('./pages/FindDoctor'));
const BecomePartner = lazy(() => import('./pages/BecomePartner'));
const BecomeTransporter = lazy(() => import('./pages/BecomeTransporter'));
const MyPrescriptions = lazy(() => import('./pages/MyPrescriptions'));
const CreatePrescription = lazy(() => import('./pages/CreatePrescription'));
const DoctorConnections = lazy(() => import('./pages/DoctorConnections'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const Settings = lazy(() => import('./pages/Settings'));
const Services = lazy(() => import('./pages/Services'));
const Notifications = lazy(() => import('./pages/Notifications'));

function App() {
  return (
    <RecoilRoot>
      <AuthProvider>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<Products />} />
            <Route path="/search-pharmacy" element={<SearchPharmacy />} />
            <Route path="/find-doctor" element={<FindDoctor />} />
            <Route path="/become-partner" element={<BecomePartner />} />
            <Route path="/become-transporter" element={<BecomeTransporter />} />
            <Route path="/my-prescriptions" element={<MyPrescriptions />} />
            <Route path="/create-prescription" element={<CreatePrescription />} />
            <Route path="/doctor-connections" element={<DoctorConnections />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/admin-settings" element={<AdminSettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/services" element={<Services />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </RecoilRoot>
  );
}

export default App;

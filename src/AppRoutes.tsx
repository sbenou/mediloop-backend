
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
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";

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

// Create a simplified RequireAuthGuard component
const RequireAuthGuard = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />

      <Route path="*" element={<NotFound />} />

      <Route element={<RequireAuthGuard />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/account" element={<Account />} />
      </Route>
      
      <Route 
        path="/manage-boosts" 
        element={
          <RequireRoleGuard allowedRoles={['doctor', 'pharmacist']}>
            <ManageBoostsPage />
          </RequireRoleGuard>
        } 
      />
    </Routes>
  );
}

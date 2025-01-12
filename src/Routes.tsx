import { Routes as RouterRoutes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Products from "@/pages/Products";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import ResetPassword from "@/pages/ResetPassword";
import AdminSettings from "@/pages/AdminSettings";
import BecomePartner from "@/pages/BecomePartner";
import BecomeTransporter from "@/pages/BecomeTransporter";
import CreatePrescription from "@/pages/CreatePrescription";
import DoctorConnections from "@/pages/DoctorConnections";
import FindDoctor from "@/pages/FindDoctor";
import MyOrders from "@/pages/MyOrders";
import MyPrescriptions from "@/pages/MyPrescriptions";
import SearchPharmacy from "@/pages/SearchPharmacy";
import Services from "@/pages/Services";

const Routes = () => {
  console.log('Routes component rendered');
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/products" element={<Products />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/become-partner" element={<BecomePartner />} />
      <Route path="/become-transporter" element={<BecomeTransporter />} />
      <Route path="/create-prescription" element={<CreatePrescription />} />
      <Route path="/doctor-connections" element={<DoctorConnections />} />
      <Route path="/find-doctor" element={<FindDoctor />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/my-prescriptions" element={<MyPrescriptions />} />
      <Route path="/search-pharmacy" element={<SearchPharmacy />} />
      <Route path="/services" element={<Services />} />
    </RouterRoutes>
  );
};

export default Routes;
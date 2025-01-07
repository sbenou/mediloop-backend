import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Products from "@/pages/Products";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import MyOrders from "@/pages/MyOrders";
import MyPrescriptions from "@/pages/MyPrescriptions";
import CreatePrescription from "@/pages/CreatePrescription";
import FindDoctor from "@/pages/FindDoctor";
import DoctorConnections from "@/pages/DoctorConnections";
import AdminSettings from "@/pages/AdminSettings";
import ResetPassword from "@/pages/ResetPassword";
import EmailConfirmationHandler from "@/components/auth/EmailConfirmationHandler";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <EmailConfirmationHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:pharmacyId" element={<Products />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={null} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          <Route path="/create-prescription" element={<CreatePrescription />} />
          <Route path="/find-doctor" element={<FindDoctor />} />
          <Route path="/doctor-connections" element={<DoctorConnections />} />
          <Route path="/admin-settings" element={<AdminSettings />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
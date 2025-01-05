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

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:pharmacyId" element={<Products />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          <Route path="/create-prescription" element={<CreatePrescription />} />
          <Route path="/find-doctor" element={<FindDoctor />} />
          <Route path="/doctor-connections" element={<DoctorConnections />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
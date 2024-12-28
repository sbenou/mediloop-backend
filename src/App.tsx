import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreatePrescription from "./pages/CreatePrescription";
import MyPrescriptions from "./pages/MyPrescriptions";
import ViewPrescription from "./components/ViewPrescription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-prescription" element={<CreatePrescription />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          <Route 
            path="/prescription/:id" 
            element={
              <ViewPrescription 
                data={{
                  patientName: "",
                  patientAddress: "",
                  doctorName: "",
                  doctorAddress: "",
                  medications: [],
                  createdAt: "",
                }} 
              />
            } 
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
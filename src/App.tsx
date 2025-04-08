import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeSupabase } from "./lib/supabase";
import { AuthProvider, useAuth } from "./hooks/auth/useAuth";
import {
  HomePage,
  LoginPage,
  RegisterPage,
  SettingsPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyPage,
  Dashboard,
  SuperAdminDashboard,
  PharmacyProfilePage,
  DoctorDashboard,
  DoctorProfilePage,
  MyOrdersPage,
  MyPrescriptionsPage,
  TeleconsultationPage,
  AppointmentsPage,
  NotificationsPage,
  ActivitiesPage,
  UpgradePage
} from "./pages";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "./config/site";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireRole } from "@/components/auth/RequireRole";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    initializeSupabase();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>
            <CartProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify" element={<VerifyPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/superadmin/dashboard" element={<RequireAuth><RequireRole roles={["superadmin"]}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/superadmin/users" element={<RequireAuth><RequireRole roles={["superadmin"]}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/superadmin/pharmacies" element={<RequireAuth><RequireRole roles={["superadmin"]}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/superadmin/doctors" element={<RequireAuth><RequireRole roles={["superadmin"]}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/superadmin/products" element={<RequireAuth><RequireRole roles={["superadmin"]}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/superadmin/settings" element={<RequireAuth><RequireRole roles={["superadmin"]}><SuperAdminDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/pharmacy/profile" element={<RequireAuth><RequireRole roles={["pharmacist"]}><PharmacyProfilePage /></RequireRole></RequireAuth>} />
                  <Route path="/doctor/profile" element={<RequireAuth><RequireRole roles={["doctor"]}><DoctorProfilePage /></RequireRole></RequireAuth>} />
                  <Route path="/doctor/dashboard" element={<RequireAuth><RequireRole roles={["doctor"]}><DoctorDashboard /></RequireRole></RequireAuth>} />
                  <Route path="/my-orders" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
                  <Route path="/my-prescriptions" element={<RequireAuth><MyPrescriptionsPage /></RequireAuth>} />
                  <Route path="/teleconsultations" element={<RequireAuth><TeleconsultationPage /></RequireAuth>} />
                  <Route path="/appointments" element={<RequireAuth><AppointmentsPage /></RequireAuth>} />
                  <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                  <Route path="/activities" element={<RequireAuth><ActivitiesPage /></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                  <Route path="/upgrade" element={<UpgradePage />} />
                </Routes>
              </Router>
            </CartProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </RecoilRoot>
    </ThemeProvider>
  );
}

export default App;

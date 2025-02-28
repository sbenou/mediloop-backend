
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Products from "./pages/Products";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SearchPharmacy from "./pages/SearchPharmacy";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import BecomeTransporter from "./pages/BecomeTransporter";
import BecomePartner from "./pages/BecomePartner";
import Teleconsultations from "./pages/Teleconsultations";
import FindDoctor from "./pages/FindDoctor";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import { Suspense as SuspenseComponent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";
import MyOrders from "./pages/MyOrders";
import MyPrescriptions from "./pages/MyPrescriptions";
import CreatePrescription from "./pages/CreatePrescription";
import Notifications from "./pages/Notifications";
import DoctorConnections from "./pages/DoctorConnections";
import AdminSettings from "./pages/AdminSettings";
import Billing from "./pages/Billing";

// Pharmacy routes
import PatientsPage from "./pages/pharmacy/PatientsPage";
import PatientDetail from "./pages/pharmacy/PatientDetail";
import OrdersPage from "./pages/pharmacy/OrdersPage";
import PrescriptionsPage from "./pages/pharmacy/PrescriptionsPage";
import PrescriptionDetail from "./pages/pharmacy/PrescriptionDetail";

// Lazy-loaded components (examples)
const Services = lazy(() => import("./pages/Services"));

const WithQueryClient = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <WithQueryClient>
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
      </WithQueryClient>
    ),
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "search-pharmacy",
        element: <SearchPharmacy />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "find-doctor",
        element: <FindDoctor />,
      },
      {
        path: "services",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <Services />
          </Suspense>
        ),
      },
      {
        path: "become-transporter",
        element: <BecomeTransporter />,
      },
      {
        path: "become-partner",
        element: <BecomePartner />,
      },
      {
        path: "teleconsultations",
        element: <Teleconsultations />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        path: "my-orders",
        element: <MyOrders />,
      },
      {
        path: "my-prescriptions",
        element: <MyPrescriptions />,
      },
      {
        path: "create-prescription",
        element: <CreatePrescription />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "doctor-connections",
        element: <DoctorConnections />,
      },
      {
        path: "admin-settings",
        element: <AdminSettings />,
      },
      {
        path: "billing",
        element: <Billing />,
      },
      // Pharmacy routes
      {
        path: "pharmacy/patients",
        element: <PatientsPage />,
      },
      {
        path: "pharmacy/patients/:id",
        element: <PatientDetail />,
      },
      {
        path: "pharmacy/orders",
        element: <OrdersPage />,
      },
      {
        path: "pharmacy/prescriptions",
        element: <PrescriptionsPage />,
      },
      {
        path: "pharmacy/prescriptions/:id",
        element: <PrescriptionDetail />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

function App() {
  return (
    <RecoilRoot>
      <SuspenseComponent fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </SuspenseComponent>
    </RecoilRoot>
  );
}

export default App;

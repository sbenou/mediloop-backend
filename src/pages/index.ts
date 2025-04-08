
// Import and re-export all page components
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Settings from "./Settings";
import Dashboard from "./Dashboard";
import DoctorDashboard from "./DoctorDashboard";
import PharmacyDashboard from "./PharmacyDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";
import DoctorProfilePage from "./doctor/DoctorProfilePage";
import PharmacyProfilePage from "./pharmacy/PharmacyProfilePage";
import UpgradePage from "./UpgradePage";
import MyOrders from "./MyOrders";
import MyPrescriptions from "./MyPrescriptions";
import Notifications from "./Notifications";
import Activities from "./Activities";
import Teleconsultation from "./Teleconsultations";
import Appointments from "./Appointments";

// Export renamed components
export {
  Home as HomePage,
  Login as LoginPage,
  Register as RegisterPage,
  Settings as SettingsPage,
  Dashboard,
  DoctorDashboard,
  PharmacyDashboard,
  SuperAdminDashboard,
  DoctorProfilePage,
  PharmacyProfilePage,
  UpgradePage,
  MyOrders as MyOrdersPage,
  MyPrescriptions as MyPrescriptionsPage,
  Notifications as NotificationsPage,
  Activities as ActivitiesPage,
  Teleconsultation as TeleconsultationPage,
  Appointments as AppointmentsPage
};

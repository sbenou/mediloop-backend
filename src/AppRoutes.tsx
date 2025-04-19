import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import RequireAuthGuard from "./components/auth/RequireAuthGuard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import DoctorDetails from "./pages/DoctorDetails";
import UpgradePage from "./pages/upgrade/UpgradePage";
import Account from "./pages/Account";
import ManageBoostsPage from "./pages/ManageBoostsPage";
import RequireRoleGuard from "./components/auth/RequireRoleGuard";

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
